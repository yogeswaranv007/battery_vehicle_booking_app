const nodemailer = require('nodemailer');

// Configure email transporter (using environment variables)
let transporter;

// Check if credentials are real (not placeholders)
const isValidEmailConfig = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  
  // Check if credentials are configured and not placeholder values
  const isNotPlaceholder = user && 
                           pass && 
                           !user.includes('your-') && 
                           !pass.includes('your-') &&
                           user !== 'your-gmail@gmail.com' &&
                           pass !== 'your-app-password';
  
  return isNotPlaceholder;
};

if (isValidEmailConfig()) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development mode: log to console instead of sending emails
  console.warn('⚠️  EMAIL_USER or EMAIL_PASSWORD not configured. Using console logging for emails.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧 [EMAIL SERVICE - DEVELOPMENT MODE]');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.html);
      console.log('---\n');
      return Promise.resolve({ response: 'Email logged to console' });
    }
  };
}

// Send OTP email
const sendOTPEmail = async (email, otp, expiryMinutes = 10) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Battery Vehicle Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for the Battery Vehicle Booking System.</p>
          
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #666;">Your OTP is:</p>
            <p style="margin: 10px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0066cc;">${otp}</p>
          </div>
          
          <p style="color: #666;">
            <strong>This OTP will expire in ${expiryMinutes} minutes.</strong>
          </p>
          
          <p style="color: #999; font-size: 12px;">
            If you did not request a password reset, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Battery Vehicle Booking System - BITS Athy
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send deactivation notification email
const sendDeactivationEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Account Deactivated - Battery Vehicle Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Account Deactivated</h2>
          <p>Dear ${userName},</p>
          
          <p style="color: #d32f2f; font-weight: bold;">
            Your account has been deactivated by the administrator.
          </p>
          
          <p>You will not be able to access the Battery Vehicle Booking System until your account is reactivated.</p>
          
          <p>If you believe this is a mistake, please contact the administrator:</p>
          <p><strong>admin@bitsathy.ac.in</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Battery Vehicle Booking System - BITS Athy
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Deactivation notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending deactivation email:', error);
    throw new Error('Failed to send deactivation email');
  }
};

// Send activation notification email
const sendActivationEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Account Reactivated - Battery Vehicle Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4caf50;">Account Reactivated</h2>
          <p>Dear ${userName},</p>
          
          <p style="color: #4caf50; font-weight: bold;">
            Your account has been reactivated!
          </p>
          
          <p>You can now access the Battery Vehicle Booking System with your email and password.</p>
          
          <p><strong>Login here:</strong> <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Battery Vehicle Booking System - BITS Athy
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Activation notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw new Error('Failed to send activation email');
  }
};

module.exports = {
  sendOTPEmail,
  sendDeactivationEmail,
  sendActivationEmail
};
