import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors for admin operations
const axiosInstance = axios.create({
  baseURL: API_URL
});

// Request interceptor to add token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling deactivation and errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User Management
export const getUsers = async () => {
  try {
    const response = await axiosInstance.get('/admin/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await axiosInstance.put(
      `/admin/users/${userId}/status`,
      { status }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(
      `/admin/users/${userId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post(
      '/admin/users/create',
      userData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(
      `/admin/users/${userId}`,
      userData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Location Management
export const getLocations = async () => {
  try {
    const response = await axiosInstance.get('/admin/locations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createLocation = async (locationData) => {
  try {
    const response = await axiosInstance.post(
      '/admin/locations',
      locationData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateLocation = async (locationId, locationData) => {
  try {
    const response = await axiosInstance.put(
      `/admin/locations/${locationId}`,
      locationData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteLocation = async (locationId) => {
  try {
    const response = await axiosInstance.delete(
      `/admin/locations/${locationId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Booking Management
export const getAllBookings = async () => {
  try {
    const response = await axiosInstance.get('/bookings');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axiosInstance.put(
      `/bookings/${bookingId}/status`,
      { status }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const approveBooking = async (bookingId) => {
  try {
    const response = await axiosInstance.put(
      `/admin/bookings/${bookingId}/approve`,
      {}
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const dispatchBooking = async (bookingId) => {
  try {
    const response = await axiosInstance.put(
      `/admin/bookings/${bookingId}/dispatch`,
      {}
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const completeBooking = async (bookingId) => {
  try {
    const response = await axiosInstance.put(
      `/admin/bookings/${bookingId}/complete`,
      {}
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    const response = await axiosInstance.delete(
      `/admin/bookings/${bookingId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const editBooking = async (bookingId, bookingData) => {
  try {
    const response = await axiosInstance.put(
      `/admin/bookings/${bookingId}/edit`,
      bookingData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Password Management
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axiosInstance.post(
      '/admin/change-password',
      { currentPassword, newPassword }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const adminService = {
  // Users
  getUsers,
  updateUserStatus,
  deleteUser,
  createUser,
  updateUser,
  // Locations
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  // Bookings
  getAllBookings,
  updateBookingStatus,
  approveBooking,
  dispatchBooking,
  completeBooking,
  deleteBooking,
  editBooking,
  // Password
  changePassword
};

export default adminService;
