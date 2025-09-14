# Single Admin System Implementation

## Overview
The Battery Vehicle Booking System now implements a single admin system with default credentials for enhanced security and simplified administration.

## Default Admin Credentials
- **Email**: `admin@bitsathy.ac.in`
- **Password**: `Admin@123`

## Key Features

### 1. Single Admin Policy
- Only one admin account can exist in the system
- Admin role has been removed from the registration form
- Backend prevents creation of additional admin users through registration
- Admin users can only be created through the seed script

### 2. Admin Password Management
- Admins can change their password through the admin dashboard
- Password change requires current password verification
- New password must be at least 6 characters long
- Password change is done through a secure modal interface

### 3. Security Enhancements
- Admin role is restricted from normal registration flow
- User model includes pre-save hook to prevent admin creation
- Password change API endpoint is admin-only with JWT authentication
- All admin routes are protected with role-based authentication

## Implementation Details

### Backend Changes

#### 1. Admin Seed Script (`backend/src/seedAdmin.js`)
```javascript
// Creates default admin user if none exists
// Email: admin@bitsathy.ac.in
// Password: Admin@123 (bcrypt hashed)
```

#### 2. User Model Updates (`backend/src/models/User.js`)
```javascript
// Pre-save hook prevents admin creation through registration
userSchema.pre('save', async function(next) {
  if (this.isNew && this.role === 'admin') {
    const error = new Error('Admin users cannot be created through registration');
    return next(error);
  }
  // ... rest of the hook
});
```

#### 3. Admin Routes (`backend/src/routes/admin.js`)
- `POST /api/admin/change-password` - Change admin password
- JWT authentication required
- Admin role verification
- Current password validation

### Frontend Changes

#### 1. Registration Form (`frontend/src/pages/Register.js`)
- Removed admin option from role selection
- Only Student and Watchman roles available for registration

#### 2. Password Change Modal (`frontend/src/components/PasswordChangeModal.js`)
- Secure password change interface
- Current password verification
- Password confirmation
- Real-time validation and feedback

#### 3. Admin Dashboard (`frontend/src/pages/AdminDashboard.js`)
- Added "Change Password" button in header
- Integrated PasswordChangeModal component
- Clean and professional UI

## Usage Instructions

### For Administrators

1. **Initial Login**:
   - Navigate to the login page
   - Use email: `admin@bitsathy.ac.in`
   - Use password: `Admin@123`

2. **Changing Password**:
   - Go to Admin Dashboard
   - Click "Change Password" button in the top-right
   - Enter current password
   - Enter new password (minimum 6 characters)
   - Confirm new password
   - Click "Update Password"

3. **User Management**:
   - View all users and their statuses
   - Approve or reject pending watchmen
   - Activate or deactivate users
   - Monitor user statistics

### For System Setup

1. **Creating Default Admin**:
   ```bash
   cd backend
   node src/seedAdmin.js
   ```

2. **Starting the System**:
   ```bash
   # Backend
   cd backend
   node src/server.js

   # Frontend
   cd frontend
   npm start
   ```

## Security Considerations

1. **Default Password**: Change the default password immediately after first login
2. **Password Policy**: Enforce strong passwords (consider implementing stricter requirements)
3. **Session Management**: Admin sessions are managed via JWT tokens
4. **Role Protection**: All admin endpoints verify role before allowing access
5. **Registration Restriction**: Admin role cannot be selected during registration

## API Endpoints

### Admin-Specific Endpoints
- `POST /api/admin/change-password` - Change admin password

### Protected Admin Endpoints
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/status` - Update user status (admin only)
- `GET /api/bookings` - Get all bookings (admin/watchman only)

## Error Handling

### Password Change Errors
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Non-admin trying to access admin endpoints
- **400 Bad Request**: Invalid current password or weak new password
- **500 Server Error**: Database or server issues

### Registration Errors
- **400 Bad Request**: Attempting to register with admin role
- **422 Validation Error**: Invalid email domain or required fields missing

## Future Enhancements

1. **Email-based Password Reset**: Add forgot password functionality
2. **Password Complexity**: Implement stricter password requirements
3. **Admin Activity Logging**: Track admin actions for audit trails
4. **Two-Factor Authentication**: Add 2FA for admin accounts
5. **Session Timeout**: Implement automatic logout for security

## File Structure
```
backend/
├── src/
│   ├── models/User.js (updated with admin prevention)
│   ├── routes/admin.js (new admin-specific routes)
│   ├── seedAdmin.js (admin creation script)
│   └── server.js (updated with admin routes)

frontend/
├── src/
│   ├── components/PasswordChangeModal.js (new)
│   ├── pages/AdminDashboard.js (updated with password change)
│   └── pages/Register.js (removed admin option)
```

This implementation ensures secure, controlled admin access while maintaining the flexibility of the role-based system for students and watchmen.