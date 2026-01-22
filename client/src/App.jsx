import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import WatchmanDashboard from './pages/WatchmanDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { jwtDecode } from 'jwt-decode';
import './index.css';
import './App.css';


// Google OAuth Callback Component
const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [error, setError] = React.useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const errorMsg = params.get('error');
      const errorDetails = params.get('details');

      console.log('Callback search params:', location.search);
      console.log('Token:', token);
      console.log('Error:', errorMsg);

      if (errorMsg) {
        setError(`${errorMsg}${errorDetails ? ': ' + errorDetails : ''}`);
        // Redirect to login after 2 seconds
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (token) {
        localStorage.setItem('token', token);
        // Decode token to get user role
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        setUser(decoded);
        // Navigate based on role
        switch (decoded.role) {
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
      } else {
        setError('No token received from server. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      setError(`Callback error: ${err.message}`);
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [location, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <p className="text-gray-600 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing Google OAuth login...</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route
              path="/student"
              element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/watchman"
              element={
                <PrivateRoute>
                  <WatchmanDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
