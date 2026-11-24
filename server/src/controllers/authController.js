const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const smsService = require('../services/smsService');
const otpQuota = require('../services/otpQuota');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const normalizeMobile = (value) => {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  const mobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(mobile) ? mobile : null;
};
const otpHash = (mobile, code) => crypto.createHmac('sha256', JWT_SECRET).update(`${mobile}:${code}`).digest('hex');
const publicUser = (user) => ({
  id: user.id, fullName: user.fullName, mobileNumber: user.mobileNumber, email: user.email,
  addressLine1: user.addressLine1, addressLine2: user.addressLine2,
  city: user.city, pincode: user.pincode, role: user.role,
});
const validAddress = ({ fullName, addressLine1, city, pincode }) =>
  typeof fullName === 'string' && !!fullName.trim() &&
  typeof addressLine1 === 'string' && !!addressLine1.trim() &&
  typeof city === 'string' && !!city.trim() &&
  typeof pincode === 'string' && /^\d{6}$/.test(pincode.trim());

exports.sendOtp = async (req, res) => {
  let quota;
  try {
    const mobile = normalizeMobile(req.body.mobileNumber);
    if (!mobile) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    const user = await prisma.user.findUnique({ where: { mobileNumber: mobile } });
    // Administrators use the separate password login and can never get a customer OTP.
    if (user?.role === 'ADMIN') {
      return res.json({ success: true, message: 'If this number can receive OTPs, a code has been sent.' });
    }
    const recentCount = await prisma.otpVerification.count({
      where: { mobileNumber: mobile, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again in 15 minutes.' });
    }
    const code = String(crypto.randomInt(100000, 1000000));
    quota = otpQuota.quotaFor(mobile, req.ip);
    const record = await prisma.$transaction(async (tx) => {
      await otpQuota.reserve(tx, quota);
      await tx.otpVerification.updateMany({
        where: { mobileNumber: mobile, isUsed: false }, data: { isUsed: true },
      });
      return tx.otpVerification.create({
        data: { mobileNumber: mobile, otpCode: otpHash(mobile, code), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      });
    });
    const result = await smsService.sendOtp(mobile, code, user?.fullName);
    if (!result.success) {
      await prisma.$transaction(async (tx) => {
        await tx.otpVerification.update({ where: { id: record.id }, data: { isUsed: true } });
        await otpQuota.release(tx, quota);
      });
      return res.status(503).json({ success: false, message: 'SMS delivery is unavailable. Please try again later.' });
    }
    return res.json({
      success: true,
      message: 'If this number can receive OTPs, a code has been sent.',
      ...(process.env.NODE_ENV !== 'production' && process.env.SMS_DEV_MODE === 'true' ? { devOtp: code } : {}),
    });
  } catch (error) {
    if (error instanceof otpQuota.DailyOtpLimitError) {
      res.set('Retry-After', String(otpQuota.secondsUntilReset(quota.day)));
      return res.status(429).json({ success: false, message: error.message });
    }
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body.mobileNumber);
    const code = req.body.otpCode;
    if (!mobile || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Enter a valid mobile number and 6-digit OTP.' });
    }
    let user = await prisma.user.findUnique({ where: { mobileNumber: mobile } });
    if (user?.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Use administrator sign-in.' });
    const record = await prisma.otpVerification.findFirst({
      where: { mobileNumber: mobile, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    if (record.otpCode !== otpHash(mobile, code)) {
      const failed = await prisma.otpVerification.updateMany({
        where: { id: record.id, isUsed: false, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
      if (failed.count && record.attempts >= 4) {
        await prisma.otpVerification.update({ where: { id: record.id }, data: { isUsed: true } });
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    const consumed = await prisma.otpVerification.updateMany({
      where: { id: record.id, isUsed: false, attempts: { lt: 5 }, expiresAt: { gt: new Date() } },
      data: { isUsed: true },
    });
    if (consumed.count !== 1) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    if (!user) {
      const registrationToken = jwt.sign({ mobileNumber: mobile, purpose: 'CUSTOMER_REGISTRATION' }, JWT_SECRET, { expiresIn: '15m' });
      return res.json({ success: true, registrationRequired: true, registrationToken });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
};

exports.completeRegistration = async (req, res) => {
  try {
    const { registrationToken, fullName, addressLine1, addressLine2, city, pincode } = req.body || {};
    if (typeof registrationToken !== 'string') return res.status(400).json({ success: false, message: 'Verify your mobile number first.' });
    let verified;
    try { verified = jwt.verify(registrationToken, JWT_SECRET); }
    catch { return res.status(401).json({ success: false, message: 'Registration expired. Request a new OTP.' }); }
    if (verified.purpose !== 'CUSTOMER_REGISTRATION' || !normalizeMobile(verified.mobileNumber)) {
      return res.status(401).json({ success: false, message: 'Verify your mobile number first.' });
    }
    if (!validAddress({ fullName, addressLine1, city, pincode }) ||
        fullName.trim().length > 100 || addressLine1.trim().length > 200 ||
        city.trim().length > 100 || (typeof addressLine2 === 'string' && addressLine2.trim().length > 200)) {
      return res.status(400).json({ success: false, message: 'Enter your name, delivery address, city and valid 6-digit PIN.' });
    }
    const user = await prisma.user.create({ data: {
      mobileNumber: verified.mobileNumber,
      fullName: fullName.trim(), addressLine1: addressLine1.trim(),
      addressLine2: typeof addressLine2 === 'string' ? addressLine2.trim() : '',
      city: city.trim(), pincode: pincode.trim(),
    } });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'This mobile number is already registered. Please sign in.' });
    console.error('Complete registration error:', error);
    return res.status(500).json({ success: false, message: 'Could not create your account.' });
  }
};

exports.getMe = (req, res) => res.json({ success: true, user: publicUser(req.user) });
exports.updateProfile = async (req, res) => {
  try {
    const data = {};
    for (const field of ['fullName', 'addressLine1', 'addressLine2', 'city']) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || (field !== 'addressLine2' && !req.body[field].trim())) {
          return res.status(400).json({ success: false, message: `Invalid ${field}.` });
        }
        data[field] = req.body[field].trim();
      }
    }
    if (req.body.pincode !== undefined) {
      if (typeof req.body.pincode !== 'string' || !/^\d{6}$/.test(req.body.pincode.trim())) {
        return res.status(400).json({ success: false, message: 'Enter a valid 6-digit PIN.' });
      }
      data.pincode = req.body.pincode.trim();
    }
    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json({ success: true, user: publicUser(updated) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
