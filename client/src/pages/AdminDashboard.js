import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import PasswordChangeModal from '../components/PasswordChangeModal';
import AdminBookingControl from '../components/AdminBookingControl';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, bookings, locations
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');
  const [bookingFilters, setBookingFilters] = useState({
    status: 'all',
    userId: '',
    watchmanId: '',
    searchText: ''
  });
  const [watchmen, setWatchmen] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    regNumber: '',
    phone: ''
  });
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    phone: '',
    regNumber: ''
  });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBookings();
    fetchLocations();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
      const watchmanList = data.filter((u) => u.role === 'watchman');
      setWatchmen(watchmanList);
      setStudents(data.filter((u) => u.role === 'student'));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await adminService.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await adminService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? Booking history will be preserved.')) {
      try {
        await adminService.deleteUser(userId);
        setUserSuccess('User deleted successfully');
        fetchUsers();
        setTimeout(() => setUserSuccess(''), 3000);
      } catch (error) {
        setUserError(error.details || 'Error deleting user');
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      setUserError('Name, email, and password are required');
      return;
    }

    if (!newUserForm.email.includes('@bitsathy.ac.in')) {
      setUserError('Email must end with @bitsathy.ac.in');
      return;
    }

    if (newUserForm.role === 'student' && !newUserForm.regNumber) {
      setUserError('Registration number required for students');
      return;
    }

    if (newUserForm.role === 'watchman' && !newUserForm.phone) {
      setUserError('Phone number required for watchmen');
      return;
    }

    try {
      await adminService.createUser(newUserForm);
      setUserSuccess('User created successfully');
      setNewUserForm({ name: '', email: '', password: '', role: 'student', regNumber: '', phone: '' });
      setShowCreateUserModal(false);
      fetchUsers();
      setTimeout(() => setUserSuccess(''), 3000);
    } catch (error) {
      setUserError(error.details || error.message || 'Error creating user');
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      phone: user.phone || '',
      regNumber: user.regNumber || ''
    });
    setShowEditUserModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!editUserForm.name.trim()) {
      setUserError('Name is required');
      return;
    }

    if (editingUser.role === 'watchman' && !editUserForm.phone.trim()) {
      setUserError('Phone number is required for watchmen');
      return;
    }

    try {
      await adminService.updateUser(editingUser._id, editUserForm);
      setUserSuccess('User updated successfully');
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setUserSuccess(''), 3000);
    } catch (error) {
      setUserError(error.details || error.message || 'Error updating user');
    }
  };

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await adminService.updateBookingStatus(bookingId, newStatus);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationError('');
    setLocationSuccess('');

    if (!newLocation.name.trim()) {
      setLocationError('Location name is required');
      return;
    }

    try {
      await adminService.createLocation(newLocation);
      setLocationSuccess('Location added successfully');
      setNewLocation({ name: '', description: '' });
      fetchLocations();
      setTimeout(() => setLocationSuccess(''), 3000);
    } catch (error) {
      setLocationError(error.message || 'Error adding location');
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setLocationError('');
    setLocationSuccess('');

    if (!editingLocation.name.trim()) {
      setLocationError('Location name is required');
      return;
    }

    try {
      await adminService.updateLocation(editingLocation._id, editingLocation);
      setLocationSuccess('Location updated successfully');
      setEditingLocation(null);
      fetchLocations();
      setTimeout(() => setLocationSuccess(''), 3000);
    } catch (error) {
      setLocationError(error.message || 'Error updating location');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await adminService.deleteLocation(locationId);
        setLocationSuccess('Location deleted successfully');
        fetchLocations();
        setTimeout(() => setLocationSuccess(''), 3000);
      } catch (error) {
        setLocationError(error.message || 'Error deleting location');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    if (userFilter === 'all') return true;
    return user.status === userFilter;
  });

  const pendingUsers = users.filter(user => user.status === 'pending');
  const activeUsers = users.filter(user => user.status === 'active');
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const activeWatchmen = watchmen.filter((watchman) => watchman.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Change Password</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4 border-b">
          {['dashboard', 'users', 'bookings', 'locations'].map((tab) => {
            const tabLabels = {
              'dashboard': 'Dashboard',
              'users': 'User Management',
              'bookings': 'Bookings',
              'locations': 'Locations'
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
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingUsers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeUsers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingBookings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Pending Bookings</h2>
            {pendingBookings.length === 0 ? (
              <p className="text-gray-500">No pending bookings</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="border border-gray-200 rounded p-3 flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{booking.user.name}</p>
                      <p className="text-sm text-gray-600">{booking.fromPlace} → {booking.destination}</p>
                      <p className="text-sm text-gray-600">{new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                    </div>
                    <button
                      onClick={() => handleBookingStatusChange(booking._id, 'approved')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add User</span>
              </button>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
              >
                <option value="all">All Users</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {userError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {userError}
            </div>
          )}
          {userSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {userSuccess}
            </div>
          )}

          {/* Create User Modal */}
          {showCreateUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4">Create New User</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="user@bitsathy.ac.in"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      <option value="student">Student</option>
                      <option value="watchman">Watchman</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {newUserForm.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        placeholder="e.g., 7376232IT286"
                        value={newUserForm.regNumber}
                        onChange={(e) => setNewUserForm({ ...newUserForm, regNumber: e.target.value })}
                        className="w-full rounded-md border border-gray-300 p-2"
                        required={newUserForm.role === 'student'}
                      />
                    </div>
                  )}
                  {newUserForm.role === 'watchman' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                        className="w-full rounded-md border border-gray-300 p-2"
                        required={newUserForm.role === 'watchman'}
                      />
                    </div>
                  )}
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition"
                    >
                      Create User
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateUserModal(false)}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {showEditUserModal && editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4">Edit User</h3>
                <form onSubmit={handleEditUser} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={editingUser.role}
                      disabled
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                  </div>
                  {editingUser.role === 'student' && editingUser.regNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        value={editUserForm.regNumber}
                        onChange={(e) => setEditUserForm({ ...editUserForm, regNumber: e.target.value })}
                        className="w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                  )}
                  {editingUser.role === 'watchman' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={editUserForm.phone}
                        onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                        className="w-full rounded-md border border-gray-300 p-2"
                        required
                      />
                    </div>
                  )}
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditUserModal(false);
                        setEditingUser(null);
                      }}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={user.isDeleted ? 'bg-gray-100 opacity-75' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.name}
                      {user.isDeleted && <span className="text-xs text-red-600 ml-2">(Deleted)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!user.isDeleted && (
                        <>
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUserStatusChange(user._id, 'active')}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUserStatusChange(user._id, 'inactive')}
                                className="text-orange-600 hover:text-orange-900 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleUserStatusChange(user._id, 'inactive')}
                              className="text-orange-600 hover:text-orange-900 font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                          {user.status === 'inactive' && (
                            <button
                              onClick={() => handleUserStatusChange(user._id, 'active')}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Booking Management</h2>
          
          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={bookingFilters.status}
                  onChange={(e) => setBookingFilters({ ...bookingFilters, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={bookingFilters.userId}
                  onChange={(e) => setBookingFilters({ ...bookingFilters, userId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">All Students</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} {student.regNumber && `(${student.regNumber})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Watchman</label>
                <select
                  value={bookingFilters.watchmanId}
                  onChange={(e) => setBookingFilters({ ...bookingFilters, watchmanId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">All Watchmen</option>
                  {activeWatchmen.map((watchman) => (
                    <option key={watchman._id} value={watchman._id}>
                      {watchman.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={bookingFilters.searchText}
                  onChange={(e) => setBookingFilters({ ...bookingFilters, searchText: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
            <button
              onClick={() => setBookingFilters({ status: 'all', userId: '', watchmanId: '', searchText: '' })}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear All Filters
            </button>
          </div>

          {/* Bookings List */}
          {(() => {
            const filtered = bookings.filter((booking) => {
              if (bookingFilters.status !== 'all' && booking.status !== bookingFilters.status) return false;
              if (bookingFilters.userId && booking.user._id !== bookingFilters.userId) return false;
              if (bookingFilters.watchmanId && booking.approvedBy?._id !== bookingFilters.watchmanId) return false;
              if (bookingFilters.searchText) {
                const searchLower = bookingFilters.searchText.toLowerCase();
                return (
                  booking.user.name.toLowerCase().includes(searchLower) ||
                  booking.fromPlace.toLowerCase().includes(searchLower) ||
                  booking.destination.toLowerCase().includes(searchLower) ||
                  booking.user.regNumber?.toLowerCase().includes(searchLower)
                );
              }
              return true;
            });

            return filtered.length === 0 ? (
              <p className="text-gray-500">No bookings found matching the filters</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Showing {filtered.length} of {bookings.length} bookings</p>
                {filtered.map((booking) => (
                  <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <button
                          onClick={() => setBookingFilters({ ...bookingFilters, userId: booking.user._id })}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 text-left"
                        >
                          {booking.user.name}
                        </button>
                        {booking.user.regNumber && (
                          <button
                            onClick={() => setBookingFilters({ ...bookingFilters, searchText: booking.user.regNumber })}
                            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                          >
                            ({booking.user.regNumber})
                          </button>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.fromPlace} → {booking.destination}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'rejected' && booking.rejectionType === 'timeout' ? 'Rejected – Time Out' : booking.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p><strong>Requested:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                      {booking.status === 'rejected' && booking.rejectionReason && (
                        <p className="text-red-600"><strong>Rejection Reason:</strong> {booking.rejectionReason}</p>
                      )}
                      {booking.approvedBy && (
                        <p>
                          <strong>Approved by:</strong>{' '}
                          <button
                            onClick={() => setBookingFilters({ ...bookingFilters, watchmanId: booking.approvedBy._id })}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {booking.approvedBy.name}
                          </button>
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

                    <AdminBookingControl booking={booking} onUpdate={fetchBookings} watchmen={activeWatchmen} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          {/* Add/Edit Location Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h2>

            {locationError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {locationError}
              </div>
            )}
            {locationSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {locationSuccess}
              </div>
            )}

            <form onSubmit={editingLocation ? handleUpdateLocation : handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                <input
                  type="text"
                  value={editingLocation ? editingLocation.name : newLocation.name}
                  onChange={(e) => editingLocation 
                    ? setEditingLocation({ ...editingLocation, name: e.target.value })
                    : setNewLocation({ ...newLocation, name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  placeholder="e.g., Main Gate, Library, Auditorium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={editingLocation ? editingLocation.description : newLocation.description}
                  onChange={(e) => editingLocation
                    ? setEditingLocation({ ...editingLocation, description: e.target.value })
                    : setNewLocation({ ...newLocation, description: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>
                {editingLocation && (
                  <button
                    type="button"
                    onClick={() => setEditingLocation(null)}
                    className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Locations List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Manage Locations</h2>
            {locations.length === 0 ? (
              <p className="text-gray-500">No locations found. Add one above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((location) => (
                  <div key={location._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">{location.name}</p>
                        {location.description && (
                          <p className="text-sm text-gray-600">{location.description}</p>
                        )}
                        {location.createdBy && (
                          <p className="text-xs text-gray-500">Created by: {location.createdBy.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};

export default AdminDashboard;