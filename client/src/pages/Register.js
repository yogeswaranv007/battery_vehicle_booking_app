import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    regNumber: '',
    phone: '',
    role: 'student'
  });
  const [error, setError] = useState({ message: '', details: null });
  const [success, setSuccess] = useState('');
  const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a Google registration
    const params = new URLSearchParams(location.search);
    const googleData = params.get('googleData');
    
    if (googleData) {
      try {
        const googleProfile = JSON.parse(decodeURIComponent(googleData));
        setFormData(prev => ({
          ...prev,
          name: googleProfile.displayName || googleProfile.name,
          email: googleProfile.email,
          googleProfile // Store the full Google profile with id, displayName, email
        }));
        setIsGoogleRegistration(true);
      } catch (err) {
        console.error('Error parsing Google data:', err);
        setError({
          message: 'Invalid registration data',
          details: 'Please try registering again'
        });
      }
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError({ message: '', details: null });
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isGoogleRegistration) {
        // Handle Google registration
        const response = await fetch(`${API_URL}/auth/register-google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            googleId: formData.googleProfile.id,
            name: formData.name,
            email: formData.email,
            regNumber: formData.regNumber
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        // Navigate based on role
        navigateBasedOnRole(data.user.role);
      } else {
        // Handle regular registration
        const user = await register(formData);
        
        // Show success message based on role and status
        if (formData.role === 'student') {
          setSuccess('Registration successful! You can now start booking vehicles.');
        } else if (formData.role === 'watchman') {
          setSuccess('Registration submitted! Your account is pending approval from an administrator.');
        } else if (formData.role === 'admin') {
          setSuccess('Admin registration submitted! Your account is pending approval from an existing administrator.');
        }
        
        // Wait a moment to show success message, then navigate
        setTimeout(() => {
          navigateBasedOnRole(user.role);
        }, 2000);
      }
    } catch (error) {
      setError({ 
        message: error.message || 'Registration failed', 
        details: error.details 
      });
    }
  };

  const navigateBasedOnRole = (role) => {
    switch (role) {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isGoogleRegistration ? 'Complete Registration' : 'Create your account'}
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

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              <p className="font-medium">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isGoogleRegistration}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

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
                  onChange={handleChange}
                  disabled={isGoogleRegistration}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isGoogleRegistration}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="student">Student</option>
                  <option value="watchman">Watchman</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'student' && (
                  <>
                    <span className="text-green-600 font-medium">✓ Active immediately</span> - Book vehicles, view bookings, manage profile
                  </>
                )}
                {formData.role === 'watchman' && (
                  <>
                    <span className="text-yellow-600 font-medium">⏳ Pending approval</span> - Approve/reject bookings, manage vehicle availability
                  </>
                )}
                {formData.role === 'admin' && (
                  <>
                    <span className="text-yellow-600 font-medium">⏳ Pending approval</span> - Full system access, user management, system configuration
                  </>
                )}
              </p>
            </div>

            {!isGoogleRegistration && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Conditional fields based on role */}
            {formData.role === 'student' && (
              <div>
                <label htmlFor="regNumber" className="block text-sm font-medium text-gray-700">
                  Registration Number
                </label>
                <div className="mt-1">
                  <input
                    id="regNumber"
                    name="regNumber"
                    type="text"
                    required
                    value={formData.regNumber}
                    onChange={handleChange}
                    placeholder="7376232IT286"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Format: 7 digits + 2 letters + 3 digits (e.g., 7376232IT286)
                </p>
              </div>
            )}

            {formData.role === 'watchman' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for communication regarding vehicle approvals
                </p>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Admin accounts require approval from an existing administrator before activation.
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isGoogleRegistration ? 'Complete Registration' : 'Register'}
              </button>
            </div>
          </form>

          {!isGoogleRegistration && (
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
                  onClick={() => window.location.href = `${API_URL.replace('/api', '')}/api/auth/google`}
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
                  Sign up with Google
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 