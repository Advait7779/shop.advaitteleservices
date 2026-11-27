const crypto = require('crypto');
const { JWT_SECRET } = require('../config/sessionSecret');

const DAILY_LIMIT = 5;
const IST_OFFSET_MS = 330 * 60 * 1000;

class DailyOtpLimitError extends Error {
  constructor() {
    super('Daily OTP limit reached for this phone number or network. Try again tomorrow.');
    this.name = 'DailyOtpLimitError';
  }
}

const indiaDay = (now) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const secondsUntilReset = (day, now = new Date()) =>
  Math.max(1, Math.ceil((Date.parse(`${day}T18:30:00.000Z`) - now.getTime()) / 1000));

const hashIdentity = (scope, value) =>
  crypto.createHmac('sha256', JWT_SECRET).update(`${scope}:${value}`).digest('hex');

const quotaFor = (mobile, ip, now = new Date()) => ({
  day: indiaDay(now),
  identities: [
    { scope: 'IP', identityHash: hashIdentity('IP', ip || 'unknown') },
    { scope: 'MOBILE', identityHash: hashIdentity('MOBILE', mobile) },
  ],
});

const reserve = async (tx, quota) => {
  await tx.otpRequestQuota.createMany({
    data: quota.identities.map((identity) => ({ ...identity, day: quota.day, count: 0 })),
    skipDuplicates: true,
  });
  for (const identity of quota.identities) {
    const result = await tx.otpRequestQuota.updateMany({
      where: { ...identity, day: quota.day, count: { lt: DAILY_LIMIT } },
      data: { count: { increment: 1 } },
    });
    if (result.count !== 1) throw new DailyOtpLimitError();
  }
};

const release = async (tx, quota) => {
  for (const identity of quota.identities) {
    await tx.otpRequestQuota.updateMany({
      where: { ...identity, day: quota.day, count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  }
};

module.exports = { DailyOtpLimitError, quotaFor, reserve, release, secondsUntilReset };
