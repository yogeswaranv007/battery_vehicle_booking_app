const passport = require('passport');
const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const result = await authService.registerLocal(req.body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginLocal(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const result = await authService.verifyOtp(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

function me(req, res) {
  const result = authService.getMe(req.user);
  return res.status(result.status).json(result.body);
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  me,
};
