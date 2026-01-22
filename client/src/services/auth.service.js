import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
authApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 403 responses (deactivated user)
authApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login?error=Account%20deactivated';
    }
    return Promise.reject(error);
  }
);

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Response with token and user data
 */
export const loginLocal = async (email, password) => {
  const response = await authApi.post('/login', { email, password });
  return response.data;
};

/**
 * Register new user
 * @param {object} userData - {name, email, password, role, regNumber?, phone?}
 * @returns {Promise} Response with token and user data
 */
export const registerLocal = async (userData) => {
  const response = await authApi.post('/register', userData);
  return response.data;
};

/**
 * Request OTP for password reset
 * @param {string} email - User email
 * @returns {Promise} Response with success message
 */
export const forgotPassword = async (email) => {
  const response = await authApi.post('/forgot-password', { email });
  return response.data;
};

/**
 * Verify OTP for password reset
 * @param {string} email - User email
 * @param {string} otp - 6-digit OTP
 * @returns {Promise} Response with resetToken
 */
export const verifyOtp = async (email, otp) => {
  const response = await authApi.post('/verify-otp', { email, otp });
  return response.data;
};

/**
 * Reset password using reset token
 * @param {string} resetToken - Token from OTP verification
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirm new password
 * @returns {Promise} Response with success message
 */
export const resetPassword = async (resetToken, newPassword, confirmPassword) => {
  const response = await authApi.post('/reset-password', {
    resetToken,
    newPassword,
    confirmPassword
  });
  return response.data;
};

/**
 * Get current logged-in user
 * @returns {Promise} User object
 */
export const getCurrentUser = async () => {
  const response = await authApi.get('/me');
  return response.data;
};

export default authApi;
