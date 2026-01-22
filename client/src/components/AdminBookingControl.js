import React, { useState } from 'react';
import adminService from '../services/admin.service';

const AdminBookingControl = ({ booking, onUpdate, watchmen }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date: booking.date?.split('T')[0] || '',
    time: booking.time || '',
    fromPlace: booking.fromPlace || '',
    destination: booking.destination || '',
    status: booking.status || 'pending',
    assignedWatchman: booking.approvedBy?._id || ''
  });
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await adminService.approveBooking(booking._id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error approving booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleDispatch = async () => {
    setProcessing(true);
    try {
      await adminService.dispatchBooking(booking._id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error dispatching booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    setProcessing(true);
    try {
      await adminService.completeBooking(booking._id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error completing booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }
    
    setProcessing(true);
    try {
      await adminService.deleteBooking(booking._id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error deleting booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await adminService.editBooking(booking._id, editForm);
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error updating booking');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {booking.status === 'pending' && (
          <>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Delete
            </button>
          </>
        )}
        {booking.status === 'approved' && (
          <>
            <button
              onClick={handleDispatch}
              disabled={processing}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Dispatch
            </button>
            <button
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Delete
            </button>
          </>
        )}
        {booking.status === 'in-progress' && (
          <>
            <button
              onClick={handleComplete}
              disabled={processing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Complete
            </button>
            <button
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Delete
            </button>
          </>
        )}
        {booking.status === 'completed' && (
          <button
            onClick={handleDelete}
            disabled={processing}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Delete
          </button>
        )}
        <button
          onClick={() => setShowEditModal(true)}
          disabled={processing}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Edit
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Booking</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Place</label>
                <input
                  type="text"
                  value={editForm.fromPlace}
                  onChange={(e) => setEditForm({ ...editForm, fromPlace: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  value={editForm.destination}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {watchmen && watchmen.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Watchman</label>
                  <select
                    value={editForm.assignedWatchman}
                    onChange={(e) => setEditForm({ ...editForm, assignedWatchman: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select Watchman (Optional)</option>
                    {watchmen.map((watchman) => (
                      <option key={watchman._id} value={watchman._id}>
                        {watchman.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={processing}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingControl;
