const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

exports.adminLogin = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId.trim() },
          { mobileNumber: loginId.trim() },
        ],
      },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials or unauthorized role.',
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'No password configured for this admin user.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully.',
      token,
      admin: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during admin authentication.' });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: {
        id: req.user.id,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber,
        fullName: req.user.fullName,
        role: req.user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin profile.' });
  }
};
