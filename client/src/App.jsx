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

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Decode token to get user role
      const decoded = jwtDecode(token);
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
    }
  }, [location, navigate, setUser]);

  return <div>Loading...</div>;
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
