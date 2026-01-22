import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (formData) => {
    try {
      const data = await authService.loginLocal(formData.email, formData.password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      const errorDetails = error.response?.data?.details || null;
      const err = new Error(errorMsg);
      err.details = errorDetails;
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      // Validate email domain
      if (!userData.email.endsWith('@bitsathy.ac.in')) {
        const err = new Error('Invalid email format');
        err.details = 'Email must end with @bitsathy.ac.in';
        throw err;
      }

      // Validate registration number format for students
      if (userData.role === 'student' && !/^[0-9]{7}[A-Z]{2}[0-9]{3}$/.test(userData.regNumber)) {
        const err = new Error('Invalid registration number format');
        err.details = 'Registration number must be in the format: 7376232IT286';
        throw err;
      }

      // Validate phone number for watchmen
      if (userData.role === 'watchman' && !userData.phone) {
        const err = new Error('Phone number is required');
        err.details = 'Phone number is required for watchmen';
        throw err;
      }

      const data = await authService.registerLocal(userData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
      const errorDetails = error.response?.data?.details || null;
      const err = new Error(errorMsg);
      err.details = errorDetails;
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 