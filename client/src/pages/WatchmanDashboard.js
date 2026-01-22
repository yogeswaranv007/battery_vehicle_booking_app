import React, { useState, useEffect, useCallback } from 'react';
import { getWatchmanBookings, updateWatchmanBookingStatus } from '../services/booking.service';

const WatchmanDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, in-progress, completed

  const fetchBookings = useCallback(async () => {
    try {
      const data = await getWatchmanBookings({ date: selectedDate });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateWatchmanBookingStatus(bookingId, newStatus);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status, booking) => {
    if (status === 'rejected' && booking.rejectionType === 'timeout') {
      return 'Rejected – Time Out';
    }
    const labels = {
      'pending': 'Requested',
      'approved': 'Approved',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const BookingCard = ({ booking }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-900">{booking.user.name}</p>
          <p className="text-sm text-gray-600">{booking.fromPlace} → {booking.destination}</p>
        </div>
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
          {getStatusLabel(booking.status, booking)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-700 mb-3">
        <p><strong>Date & Time:</strong> {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
        <p><strong>Requested:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
        {booking.status === 'rejected' && booking.rejectionReason && (
          <p className="text-red-600"><strong>Rejection Reason:</strong> {booking.rejectionReason}</p>
        )}
        {booking.approvedBy && (
          <p><strong>Approved by:</strong> {booking.approvedBy.name} 
            {booking.approvalTime && ` on ${new Date(booking.approvalTime).toLocaleString()}`}
          </p>
        )}
        {booking.dispatchTime && (
          <p><strong>Dispatched:</strong> {new Date(booking.dispatchTime).toLocaleString()}</p>
        )}
        {booking.completionTime && (
          <p><strong>Completed:</strong> {new Date(booking.completionTime).toLocaleString()}</p>
        )}
      </div>

      {activeTab === 'pending' && (
        <div className="space-x-2 flex justify-end">
          <button
            onClick={() => handleStatusChange(booking._id, 'approved')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition"
          >
            Approve
          </button>
          <button
            onClick={() => handleStatusChange(booking._id, 'rejected')}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition"
          >
            Reject
          </button>
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="space-x-2 flex justify-end">
          <button
            onClick={() => handleStatusChange(booking._id, 'in-progress')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm transition"
          >
            Start Dispatch
          </button>
        </div>
      )}

      {activeTab === 'in-progress' && (
        <div className="space-x-2 flex justify-end">
          <button
            onClick={() => handleStatusChange(booking._id, 'completed')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition"
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Watchman Dashboard</h1>

      {/* Date Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4 border-b">
          {['pending', 'approved', 'in-progress', 'completed'].map((tab) => {
            const tabLabelMap = {
              'pending': 'Requested',
              'approved': 'Approved',
              'in-progress': 'In Progress',
              'completed': 'Completed'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tabLabelMap[tab]} ({bookings.filter(b => b.status === tab).length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {activeTab === 'pending' && 'Requested Bookings'}
          {activeTab === 'approved' && 'Approved Bookings'}
          {activeTab === 'in-progress' && 'In Progress Bookings'}
          {activeTab === 'completed' && 'Booking History'}
        </h2>

        {filteredBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No {activeTab} bookings for this date</p>
        ) : (
          <div>
            {filteredBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchmanDashboard; 