import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL for general bookings (admin/student)
const bookingApi = axios.create({
  baseURL: `${API_URL}/bookings`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios instance for watchman-specific endpoints
const watchmanApi = axios.create({
  baseURL: `${API_URL}/watchman/bookings`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
bookingApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

watchmanApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 403 responses (deactivated user)
bookingApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login?error=Account%20deactivated';
    }
    return Promise.reject(error);
  }
);

watchmanApi.interceptors.response.use(
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
 * Get list of available locations
 * @returns {Promise} Array of locations with _id and name
 */
export const getLocations = async () => {
  const response = await bookingApi.get('/locations/list');
  return response.data;
};

/**
 * Get user's own bookings
 * @returns {Promise} Array of user's bookings
 */
export const getMyBookings = async () => {
  const response = await bookingApi.get('/my-bookings');
  return response.data;
};

/**
 * Get all bookings (admin/watchman only)
 * @param {object} filters - Optional filters {date, status}
 * @returns {Promise} Array of all bookings
 */
export const getAllBookings = async (filters = {}) => {
  const response = await bookingApi.get('/', { params: filters });
  return response.data;
};

// Watchman: get bookings scoped for watchman
export const getWatchmanBookings = async (filters = {}) => {
  const response = await watchmanApi.get('/', { params: filters });
  return response.data;
};

/**
 * Create new booking
 * @param {object} bookingData - {date, time, fromPlace, destination}
 * @returns {Promise} Created booking object
 */
export const createBooking = async (bookingData) => {
  const response = await bookingApi.post('/', bookingData);
  return response.data;
};

/**
 * Update booking status (admin/watchman only)
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status (pending, approved, in-progress, completed, rejected)
 * @param {object} options - Optional {rejectionType}
 * @returns {Promise} Updated booking object
 */
export const updateBookingStatus = async (bookingId, status, options = {}) => {
  const response = await bookingApi.put(`/${bookingId}/status`, {
    status,
    ...options
  });
  return response.data;
};

// Watchman: update booking status
export const updateWatchmanBookingStatus = async (bookingId, status, options = {}) => {
  const response = await watchmanApi.put(`/${bookingId}/status`, {
    status,
    ...options
  });
  return response.data;
};

/**
 * Approve booking (admin only)
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Updated booking
 */
export const approveBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'approved');
};

/**
 * Dispatch booking/set in-progress (watchman/admin)
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Updated booking
 */
export const dispatchBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'in-progress');
};

/**
 * Mark booking as completed (watchman/admin)
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Updated booking
 */
export const completeBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'completed');
};

/**
 * Reject booking (admin only)
 * @param {string} bookingId - Booking ID
 * @param {string} rejectionType - Optional 'manual' or 'timeout'
 * @returns {Promise} Updated booking
 */
export const rejectBooking = async (bookingId, rejectionType = 'manual') => {
  return updateBookingStatus(bookingId, 'rejected', { rejectionType });
};

/**
 * Delete booking (admin only)
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Success response
 */
export const deleteBooking = async (bookingId) => {
  const response = await bookingApi.delete(`/${bookingId}`);
  return response.data;
};

export default bookingApi;
