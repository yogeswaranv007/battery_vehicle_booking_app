const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { logAudit } = require('../utils/auditLogger');
const { sendOTPEmail } = require('../utils/emailService');

const signUserToken = (user) => jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

async function registerLocal({ name, email, password, regNumber, role, phone }) {
  if (!name || !email || !password) {
    return { status: 400, body: { message: 'Missing required fields', details: { name: !name ? 'Name is required' : undefined, email: !email ? 'Email is required' : undefined, password: !password ? 'Password is required' : undefined } } };
  }
  if (!email.endsWith('@bitsathy.ac.in')) {
    return { status: 400, body: { message: 'Invalid email format', details: 'Email must end with @bitsathy.ac.in' } };
  }
  if (role === 'student') {
    if (!regNumber) {
      return { status: 400, body: { message: 'Registration number is required for students', details: 'Please provide your registration number' } };
    }
    const regNumberRegex = /^[0-9]{7}[A-Z]{2}[0-9]{3}$/;
    if (!regNumberRegex.test(regNumber)) {
      return { status: 400, body: { message: 'Invalid registration number format', details: 'Registration number must be in the format: 7376232IT286' } };
    }
  }
  if (role === 'watchman' && !phone) {
    return { status: 400, body: { message: 'Phone number is required for watchmen', details: 'Please provide your phone number' } };
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { status: 400, body: { message: 'User already exists', details: 'A user with this email already exists' } };
  }
  const status = role === 'student' ? 'active' : 'pending';
  const user = new User({ name, email, password, regNumber, role, phone, status });
  await user.save();
  const token = signUserToken(user);
  return { status: 201, body: { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } } };
}

async function loginLocal({ email, password }, reqMeta) {
  if (!email || !password) {
    return { status: 400, body: { message: 'Missing required fields', details: { email: !email ? 'Email is required' : undefined, password: !password ? 'Password is required' : undefined } } };
  }
  const user = await User.findOne({ email });
  if (!user) {
    return { status: 401, body: { message: 'Invalid credentials', details: 'No user found with this email' } };
  }
  if (user.googleId) {
    return { status: 401, body: { message: 'Invalid login method', details: 'This account was created using Google. Please use Google Sign-In.' } };
  }
  if (user.status !== 'active') {
    await logAudit('login_blocked_deactivated', user, null, { details: `Login blocked - account status: ${user.status}`, ipAddress: reqMeta.ip, userAgent: reqMeta.userAgent });
    return { status: 403, body: { message: 'Account deactivated', details: 'Your account has been deactivated by the admin. Please contact the administrator.' } };
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return { status: 401, body: { message: 'Invalid credentials', details: 'Incorrect password' } };
  }
  const token = signUserToken(user);
  await logAudit('login_attempt', user, null, { details: 'Successful login', ipAddress: reqMeta.ip, userAgent: reqMeta.userAgent, status: 'success' });
  return { status: 200, body: { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } } };
}

async function forgotPassword({ email }, reqMeta) {
  if (!email) {
    return { status: 400, body: { message: 'Email is required', details: 'Please provide your registered email' } };
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { status: 200, body: { message: 'OTP sent', details: 'If this email is registered, you will receive an OTP shortly.' } };
  }
  if (user.role === 'admin') {
    return { status: 403, body: { message: 'OTP reset not available', details: 'Admin accounts cannot use OTP-based password reset. Please contact the system administrator.' } };
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = OTP.hashOTP(otp);
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
  await OTP.deleteMany({ email: email.toLowerCase() });
  await OTP.create({ email: email.toLowerCase(), otp, otpHash, expiresAt: expiryTime });
  await sendOTPEmail(email, otp, 10);
  await logAudit('otp_generated', null, null, { details: 'OTP generated for password reset', email: user.email, role: user.role, ipAddress: reqMeta.ip, userAgent: reqMeta.userAgent, status: 'success' });
  return { status: 200, body: { message: 'OTP sent', details: 'Check your email for the OTP. It will expire in 10 minutes.' } };
}

async function verifyOtp({ email, otp }, reqMeta) {
  if (!email || !otp) {
    return { status: 400, body: { message: 'Email and OTP are required', details: 'Please provide both email and OTP' } };
  }
  const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
  if (!otpRecord) {
    await logAudit('otp_verification_failed', null, null, { details: 'OTP not found', email, errorMessage: 'No OTP found for this email', status: 'failure' });
    return { status: 400, body: { message: 'OTP expired or not found', details: 'Please request a new OTP' } };
  }
  if (otpRecord.isUsed) {
    await logAudit('otp_verification_failed', null, null, { details: 'OTP already used', email, errorMessage: 'This OTP has already been used', status: 'failure' });
    return { status: 400, body: { message: 'OTP already used', details: 'Please request a new OTP' } };
  }
  if (otpRecord.expiresAt < new Date()) {
    await logAudit('otp_verification_failed', null, null, { details: 'OTP expired', email, errorMessage: 'OTP has expired', status: 'failure' });
    return { status: 400, body: { message: 'OTP expired', details: 'Please request a new OTP' } };
  }
  const isValid = otpRecord.verifyOTP(otp);
  if (!isValid) {
    otpRecord.attempts += 1;
    if (otpRecord.attempts >= 3) { await otpRecord.deleteOne(); } else { await otpRecord.save(); }
    await logAudit('otp_verification_failed', null, null, { details: `Invalid OTP (attempt ${otpRecord.attempts})`, email, errorMessage: 'Invalid OTP', status: 'failure' });
    return { status: 400, body: { message: 'Invalid OTP', details: `${3 - otpRecord.attempts} attempts remaining` } };
  }
  otpRecord.isUsed = true;
  await otpRecord.save();
  const resetToken = jwt.sign({ email: email.toLowerCase(), type: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const user = await User.findOne({ email: email.toLowerCase() });
  await logAudit('otp_verified', user, null, { details: 'OTP verified successfully', ipAddress: reqMeta.ip, userAgent: reqMeta.userAgent, status: 'success' });
  return { status: 200, body: { message: 'OTP verified', details: 'You can now reset your password', resetToken } };
}

async function resetPassword({ resetToken, newPassword, confirmPassword }, reqMeta) {
  if (!resetToken || !newPassword || !confirmPassword) {
    return { status: 400, body: { message: 'Missing required fields', details: 'Please provide reset token and new password' } };
  }
  if (newPassword !== confirmPassword) {
    return { status: 400, body: { message: 'Passwords do not match', details: 'Confirm password must match the new password' } };
  }
  if (newPassword.length < 8) {
    return { status: 400, body: { message: 'Weak password', details: 'Password must be at least 8 characters long' } };
  }
  let decoded;
  try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); } catch (e) {
    return { status: 400, body: { message: 'Invalid or expired reset token', details: 'Please request a new password reset' } };
  }
  if (decoded.type !== 'password-reset') {
    return { status: 400, body: { message: 'Invalid token', details: 'This token cannot be used for password reset' } };
  }
  const user = await User.findOne({ email: decoded.email });
  if (!user) { return { status: 404, body: { message: 'User not found', details: 'No user found with this email' } }; }
  user.password = newPassword;
  await user.save();
  await logAudit('password_reset_successful', user, null, { details: 'Password reset successful', ipAddress: reqMeta.ip, userAgent: reqMeta.userAgent, status: 'success' });
  return { status: 200, body: { message: 'Password reset successful', details: 'Your password has been updated. Please log in with your new password.' } };
}

function getMe(user) {
  return { status: 200, body: user };
}

async function registerGoogle({ googleId, name, email, regNumber }) {
  if (!googleId || !name || !email || !regNumber) {
    return { status: 400, body: { message: 'Missing required fields', details: 'All fields are required' } };
  }
  if (!email.endsWith('@bitsathy.ac.in')) {
    return { status: 400, body: { message: 'Invalid email format', details: 'Email must end with @bitsathy.ac.in' } };
  }
  const regNumberRegex = /^[0-9]{7}[A-Z]{2}[0-9]{3}$/;
  if (!regNumberRegex.test(regNumber)) {
    return { status: 400, body: { message: 'Invalid registration number format', details: 'Registration number must be in the format: 7376232IT286' } };
  }

  // Find or create user
  let user = await User.findOne({ googleId });
  
  if (!user) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail && !existingEmail.googleId) {
      // Email exists but not linked to Google
      return { status: 400, body: { message: 'Email already registered', details: 'This email is already registered. Please use login with email/password or contact support.' } };
    }
    if (existingEmail && existingEmail.googleId === googleId) {
      user = existingEmail;
    } else {
      // Create new user
      user = await User.create({
        googleId,
        name,
        email,
        regNumber,
        role: 'student',
        status: 'active',
      });
    }
  } else {
    // Update regNumber if missing
    if (!user.regNumber) {
      user.regNumber = regNumber;
      await user.save();
    }
  }

  const token = signUserToken(user);
  return { status: 201, body: { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } } };
}

module.exports = {
  registerLocal,
  loginLocal,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  registerGoogle,
};
