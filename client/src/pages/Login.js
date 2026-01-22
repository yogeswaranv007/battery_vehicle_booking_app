import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/auth.service';

const Login = () => {
  const [view, setView] = useState('login'); // login, forgot-password, verify-otp, reset-password
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [forgotData, setForgotData] = useState({
    email: ''
  });
  const [otpData, setOtpData] = useState({
    email: '',
    otp: ''
  });
  const [resetData, setResetData] = useState({
    resetToken: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState({ message: '', details: null });
  const [success, setSuccess] = useState({ message: '', details: null });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e, dataType = 'login') => {
    if (dataType === 'login') {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    } else if (dataType === 'forgot') {
      setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    } else if (dataType === 'otp') {
      setOtpData({ ...otpData, [e.target.name]: e.target.value });
    } else if (dataType === 'reset') {
      setResetData({ ...resetData, [e.target.name]: e.target.value });
    }
    setError({ message: '', details: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData);
      setSuccess({ message: 'Login successful!', details: null });
      // Navigate based on user role
      switch (user.role) {
        case 'student':
          navigate('/student');
          break;
        case 'watchman':
          navigate('/watchman');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/login');
      }
    } catch (error) {
      setError({ 
        message: error.message || 'Login failed', 
        details: error.details 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.forgotPassword(forgotData.email);
      setSuccess({ 
        message: response.message, 
        details: response.details 
      });
      setOtpData({ email: forgotData.email, otp: '' });
      setView('verify-otp');
    } catch (error) {
      setError({ 
        message: error.response?.data?.message || 'Failed to send OTP', 
        details: error.response?.data?.details 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.verifyOtp(otpData.email, otpData.otp);
      setSuccess({ 
        message: response.message, 
        details: response.details 
      });
      setResetData({ 
        resetToken: response.resetToken, 
        newPassword: '', 
        confirmPassword: '' 
      });
      setView('reset-password');
    } catch (error) {
      setError({ 
        message: error.response?.data?.message || 'OTP verification failed', 
        details: error.response?.data?.details 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetData.newPassword !== resetData.confirmPassword) {
        setError({ 
          message: 'Passwords do not match', 
          details: 'Please ensure both password fields match' 
        });
        setLoading(false);
        return;
      }

      if (resetData.newPassword.length < 8) {
        setError({ 
          message: 'Weak password', 
          details: 'Password must be at least 8 characters long' 
        });
        setLoading(false);
        return;
      }

      const response = await authService.resetPassword(
        resetData.resetToken,
        resetData.newPassword,
        resetData.confirmPassword
      );
      setSuccess({ 
        message: response.message, 
        details: 'You can now log in with your new password' 
      });
      setTimeout(() => {
        setView('login');
        setFormData({ email: '', password: '' });
        setSuccess({ message: '', details: null });
      }, 2000);
    } catch (error) {
      setError({ 
        message: error.response?.data?.message || 'Password reset failed', 
        details: error.response?.data?.details 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {view === 'login' && 'Sign in to your account'}
          {view === 'forgot-password' && 'Reset your password'}
          {view === 'verify-otp' && 'Verify OTP'}
          {view === 'reset-password' && 'Set new password'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error.message && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <p className="mt-1 text-sm">{error.details}</p>
              )}
            </div>
          )}

          {success.message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              <p className="font-medium">{success.message}</p>
              {success.details && (
                <p className="mt-1 text-sm">{success.details}</p>
              )}
            </div>
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange(e, 'login')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) => handleChange(e, 'login')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setView('forgot-password');
                    setError({ message: '', details: null });
                    setSuccess({ message: '', details: null });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign up
                  </a>
                </p>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot-password' && (
            <>
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                    Registered Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      required
                      value={forgotData.email}
                      onChange={(e) => handleChange(e, 'forgot')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    We'll send you a one-time password (OTP) to reset your password.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setView('login');
                    setError({ message: '', details: null });
                    setSuccess({ message: '', details: null });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* VERIFY OTP VIEW */}
          {view === 'verify-otp' && (
            <>
              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength="6"
                      required
                      value={otpData.otp}
                      onChange={(e) => handleChange(e, 'otp')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    A 6-digit OTP has been sent to your email. It expires in 10 minutes.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setView('forgot-password');
                    setError({ message: '', details: null });
                    setSuccess({ message: '', details: null });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {/* RESET PASSWORD VIEW */}
          {view === 'reset-password' && (
            <>
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      required
                      value={resetData.newPassword}
                      onChange={(e) => handleChange(e, 'reset')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={resetData.confirmPassword}
                      onChange={(e) => handleChange(e, 'reset')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 