import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as bookingService from '../services/booking.service';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newBooking, setNewBooking] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    fromPlace: '',
    destination: ''
  });
  const [error, setError] = useState({ message: '', details: null });
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);

  useEffect(() => {
    // Check if user is deactivated
    if (user && user.status !== 'active') {
      setError({ 
        message: 'Account Deactivated', 
        details: 'Your account has been deactivated by the admin. Please contact the administrator.' 
      });
    }
    fetchBookings();
    fetchLocations();
  }, [user]);

  // Generate available times based on current date and time
  useEffect(() => {
    generateAvailableTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newBooking.date]);

  const generateAvailableTimes = () => {
    const times = [];
    const now = new Date();
    const selectedDate = new Date(newBooking.date);
    
    // Set selected date to start of day
    selectedDate.setHours(0, 0, 0, 0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    // Check if selected date is today
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Generate times from 06:00 to 22:00 in 30-minute intervals
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const [h, m] = timeStr.split(':').map(Number);
        const timeDate = new Date(selectedDate);
        timeDate.setHours(h, m);

        // If today, only show future times
        if (isToday) {
          if (timeDate > now) {
            times.push(timeStr);
          }
        } else {
          times.push(timeStr);
        }
      }
    }

    setAvailableTimes(times);
  };

  const fetchLocations = async () => {
    try {
      const locations = await bookingService.getLocations();
      setLocations(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings();
      setBookings(bookings);
      setError({ message: '', details: null });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response) {
        // Server responded with an error
        const errorMessage = error.response.data.message || 'Failed to fetch bookings';
        const errorDetails = error.response.data.details || error.response.data.error || 'Please try again later';
        
        // If account deactivated, show different message
        if (error.response.status === 403) {
          setError({ 
            message: 'Account Deactivated', 
            details: 'Your account has been deactivated by the admin. Please contact the administrator.' 
          });
        } else {
          setError({ message: errorMessage, details: errorDetails });
        }
      } else if (error.request) {
        // Request was made but no response received
        setError({ 
          message: 'Network error', 
          details: 'Please check your internet connection and try again'
        });
      } else {
        // Something else went wrong
        setError({ 
          message: 'Error', 
          details: error.message || 'An unexpected error occurred'
        });
      }
      setBookings([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ message: '', details: null });
    setSuccess('');
    
    // DEACTIVATION CHECK
    if (user && user.status !== 'active') {
      setError({ 
        message: 'Account Deactivated', 
        details: 'Your account has been deactivated. You cannot create bookings.' 
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate from and to locations are different
      if (newBooking.fromPlace === newBooking.destination) {
        setError({ message: 'Invalid Location', details: 'Pickup and destination locations must be different' });
        setIsSubmitting(false);
        return;
      }

      // Validate date is not in the past
      const selectedDate = new Date(newBooking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError({ message: 'Invalid Date', details: 'Cannot book for past dates' });
        setIsSubmitting(false);
        return;
      }

      const bookingData = {
        date: newBooking.date,
        time: newBooking.time,
        fromPlace: newBooking.fromPlace,
        destination: newBooking.destination
      };

      const booking = await bookingService.createBooking(bookingData);
      setBookings([booking, ...bookings]);
      setNewBooking({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        fromPlace: '',
        destination: ''
      });
      setSuccess('Booking created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response) {
        const errorMessage = error.response.data.message || 'Failed to create booking';
        const errorDetails = error.response.data.details || error.response.data.error || 'Please try again later';
        
        // If account deactivated, update user status
        if (error.response.status === 403 && error.response.data.message === 'Account deactivated') {
          setError({ message: 'Account Deactivated', details: 'Your account has been deactivated by the admin. Please contact the administrator.' });
        } else {
          setError({ message: errorMessage, details: errorDetails });
        }
      } else if (error.request) {
        setError({ 
          message: 'Network error', 
          details: 'Please check your internet connection and try again'
        });
      } else {
        setError({ 
          message: 'Error', 
          details: error.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
      
      {/* New Booking Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">New Booking</h2>
        {error.message && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong className="font-bold">{error.message}</strong>
            {error.details && (
              <div className="mt-2">
                {typeof error.details === 'string' ? (
                  <p className="text-sm">{error.details}</p>
                ) : Array.isArray(error.details) ? (
                  <ul className="list-disc list-inside text-sm">
                    {error.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                ) : typeof error.details === 'object' ? (
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(error.details).map(([field, message]) => (
                      message && <li key={field}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Place</label>
              <select
                value={newBooking.fromPlace}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, fromPlace: e.target.value });
                  setError({ message: '', details: null });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                required
                disabled={isSubmitting}
              >
                <option value="">Select pickup location</option>
                {locations.map((location) => (
                  <option 
                    key={location._id} 
                    value={location.name}
                    disabled={location.name === newBooking.destination}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select
                value={newBooking.destination}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, destination: e.target.value });
                  setError({ message: '', details: null });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                required
                disabled={isSubmitting}
              >
                <option value="">Select destination</option>
                {locations.map((location) => (
                  <option 
                    key={location._id} 
                    value={location.name}
                    disabled={location.name === newBooking.fromPlace}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newBooking.date}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, date: e.target.value });
                  setError({ message: '', details: null });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                required
                min={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time (24-hour format)</label>
              <select
                value={newBooking.time}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, time: e.target.value });
                  setError({ message: '', details: null });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                required
                disabled={isSubmitting || availableTimes.length === 0}
              >
                <option value="">Select time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={isSubmitting || availableTimes.length === 0}
          >
            {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>
      </div>

      {/* Bookings List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Date & Time:</strong> {new Date(booking.date).toLocaleDateString()} at {booking.time}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Route:</strong> {booking.fromPlace} → {booking.destination}
                    </p>
                  </div>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status === 'pending' ? 'Requested' :
                     booking.status === 'approved' ? 'Approved' :
                     booking.status === 'in-progress' ? 'In Progress' :
                     booking.status === 'completed' ? 'Completed' :
                     booking.status === 'rejected' && booking.rejectionType === 'timeout' ? 'Rejected – Time Out' :
                     booking.status}
                  </span>
                </div>
                
                <div className="border-t pt-3 space-y-2 text-sm">
                  <p className="text-gray-700">
                    <strong>Requested:</strong> {new Date(booking.createdAt).toLocaleString()}
                  </p>
                  {booking.status === 'rejected' && booking.rejectionReason && (
                    <p className="text-red-600">
                      <strong>Rejection Reason:</strong> {booking.rejectionReason}
                    </p>
                  )}
                  {booking.approvedBy && (
                    <p className="text-gray-700">
                      <strong>Approved by:</strong> {booking.approvedBy.name} 
                      {booking.approvalTime && (
                        <span> on {new Date(booking.approvalTime).toLocaleString()}</span>
                      )}
                    </p>
                  )}
                  {booking.dispatchTime && (
                    <p className="text-gray-700">
                      <strong>Dispatched:</strong> {new Date(booking.dispatchTime).toLocaleString()}
                    </p>
                  )}
                  {booking.completionTime && (
                    <p className="text-gray-700">
                      <strong>Completed:</strong> {new Date(booking.completionTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard; 