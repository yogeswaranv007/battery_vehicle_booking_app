# Battery Vehicle Booking System

A role-based MERN application for managing battery-powered vehicle bookings at BIT Sathy College, featuring admin approval workflows, real-time booking management, and comprehensive audit logging.

License: MIT

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Role-Based Access Control](#role-based-access-control)
- [API Architecture](#api-architecture)
- [Security Implementation](#security-implementation)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

The Battery Vehicle Booking System streamlines the process of requesting and managing battery-powered vehicle usage at BIT Sathy College. The application enforces a structured approval workflow where:

- Students create time-based booking requests with pickup and destination details
- Watchmen manage and complete approved bookings in real-time
- Admin oversees the entire system with user management and booking oversight capabilities

This project demonstrates a production-ready MERN stack implementation with enterprise-level features including audit logging, email notifications, role-based access control, and automated booking timeout handling.

---

## Tech Stack & Architecture

### Technology Choices

| Technology | Purpose | Justification |
|------------|---------|---------------|
| MongoDB | Database | Document-based model naturally fits user profiles, bookings, and nested relationships. Flexible schema supports evolving requirements. |
| Express.js | Backend Framework | Lightweight, mature, and middleware-based routing enables clean separation of concerns. Excellent ecosystem for authentication and validation. |
| React | Frontend Framework | Component reusability critical for role-specific dashboards. Virtual DOM ensures smooth UI updates for real-time booking status changes. |
| Node.js | Runtime | JavaScript full-stack reduces context switching and enables code reuse (validation logic, utilities). Non-blocking I/O handles concurrent bookings efficiently. |
| TailwindCSS | Styling Framework | Utility-first approach accelerates UI development. Responsive design out-of-the-box. Smaller bundle size vs traditional CSS frameworks. |
| JWT | Authentication | Stateless authentication enables horizontal scaling. Token-based approach simplifies mobile app integration (future). |
| Passport.js | OAuth Strategy | Standardized authentication middleware. Simplifies Google OAuth integration with minimal boilerplate. |

### Architecture Pattern: Controller-Service-Model

```
Routes --> Controllers --> Services --> Models --> Database
```

**Why This Pattern?**
- Separation of Concerns: Routes handle HTTP, controllers orchestrate logic, services contain business rules
- Testability: Service layer can be unit-tested independently
- Reusability: Services can be called from multiple controllers
- Scalability: Controllers can easily be split into microservices if needed

---

## Key Features

### Authentication & Authorization
- Email/password registration with domain validation (@bitsathy.ac.in)
- Google OAuth 2.0 integration for streamlined sign-in
- JWT-based stateless authentication
- Role-based middleware enforces access control at route level
- Single admin system (seeded, not registrable for security)
- Deactivated user validation at both login and API layers

### Student Features
- Create time-based vehicle bookings (date, time, pickup location, destination)
- Same route conflict detection (prevents double-booking identical routes)
- View booking history with real-time status updates
- Booking lifecycle: Pending → Approved → In Progress → Completed
- Automated timeout rejection for past-date bookings

### Watchman Features
- Dashboard for assigned bookings (approved status)
- Mark bookings as "In Progress" when vehicle departs
- Mark bookings as "Completed" when vehicle returns
- View student details and booking information

### Admin Features
- User Management: Approve/deactivate users, view all registered users
- Booking Oversight: Approve/reject booking requests, view all bookings
- Location Management: Add/edit/delete pickup and destination locations
- Audit Log Viewing: Track all system actions (user status changes, booking approvals, etc.)
- Password Change: Secure password update with current password verification

### System Features
- Audit Logging: All admin actions logged with timestamp, user, and details
- Email Notifications: Activation/deactivation emails (dev mode logs to console)
- Automated Booking Timeout: Cron job auto-rejects bookings past their scheduled time
- Responsive UI: Mobile-friendly design with TailwindCSS
- Error Handling: Comprehensive error responses with user-friendly messages

---

## Project Structure

```
Booking_app/
├── server/                      # Backend (Express + MongoDB)
│   ├── app.js                   # Express app configuration
│   ├── server.js                # Entry point, starts HTTP server
│   ├── config/
│   │   └── passport.js          # Google OAuth + JWT strategies
│   ├── controllers/             # Route handlers (orchestration)
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   └── admin.controller.js
│   ├── services/                # Business logic layer
│   │   ├── auth.service.js
│   │   └── booking.service.js
│   ├── routes/                  # API endpoint definitions
│   │   ├── auth.routes.js       # /api/auth/*
│   │   ├── student.routes.js    # /api/student/*
│   │   ├── watchman.routes.js   # /api/watchman/*
│   │   └── admin.routes.js      # /api/admin/*
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Booking.js
│   │   ├── Location.js
│   │   ├── AuditLog.js
│   │   └── OTP.js
│   ├── middleware/              # Custom middleware
│   │   ├── auth.middleware.js   # JWT verification
│   │   └── role.middleware.js   # Role-based access control
│   └── utils/                   # Helper functions
│       ├── emailService.js      # Email notifications
│       ├── auditLogger.js       # Audit log creation
│       └── bookingTimeoutChecker.js  # Cron job for expired bookings
│
├── client/                      # Frontend (React + TailwindCSS)
│   ├── public/
│   ├── src/
│   │   ├── pages/               # Role-specific dashboards
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── WatchmanDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.js
│   │   │   ├── PrivateRoute.js
│   │   │   ├── PasswordChangeModal.js
│   │   │   └── AdminBookingControl.js
│   │   ├── services/            # API client (Axios)
│   │   │   ├── auth.service.js
│   │   │   ├── booking.service.js
│   │   │   └── admin.service.js
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth state
│   │   ├── App.jsx              # Root component + routing
│   │   └── index.js             # React entry point
│   ├── tailwind.config.js       # TailwindCSS configuration
│   └── package.json
│
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json                 # Root package.json (backend scripts)
└── README.md
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v18+ recommended)
- MongoDB (v6.0+) or MongoDB Atlas
- npm or yarn

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yogeswaranv007/battery_vehicle_booking_app.git
cd battery_vehicle_booking_app
```

#### 2. Backend Setup

```bash
# Install root dependencies (backend)
npm install

# Configure environment variables
cp .env.example .env

# Edit .env with your credentials
# Required: MONGODB_URI, JWT_SECRET, SESSION_SECRET
# Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL credentials

# Seed the default admin user
node server/seedAdmin.js

# Start backend server
npm start
```

Backend will run on http://localhost:5000

#### 3. Frontend Setup

Open a new terminal window:

```bash
cd client

# Install frontend dependencies
npm install

# (Optional) Configure frontend environment
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start React development server
npm start
```

Frontend will run on http://localhost:3000 and open automatically in your browser.

---

## Environment Variables

### Backend (.env in root directory)

Create a .env file in the root directory based on .env.example:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/battery-vehicle-booking
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Authentication Secrets
JWT_SECRET=your_strong_jwt_secret_here
SESSION_SECRET=your_strong_session_secret_here

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service (Optional - dev mode logs to console)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Important Notes:**
- Generate strong secrets for JWT_SECRET and SESSION_SECRET (min 32 characters)
- Google OAuth credentials can be obtained from Google Cloud Console
- Gmail App Password: Enable 2FA, then generate at Google App Passwords
- If EMAIL_USER or EMAIL_PASSWORD is missing, emails will be logged to console (dev mode)

### Frontend (Optional - client/.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

If not set, defaults to http://localhost:5000/api.

---

## Role-Based Access Control

### Roles & Permissions

| Role | Registration | Default Status | Permissions |
|------|-------------|----------------|-------------|
| Student | Open | pending → Admin approval required | Create bookings, view own bookings |
| Watchman | Open | pending → Admin approval required | View assigned bookings, update booking status |
| Admin | Seeded only | active | Full system access (user management, booking oversight, locations, audit logs) |

### Access Flow

Registration → Status: pending → Admin Reviews & Approves → Status: active → Full Access to System

### Security Enforcement

**1. Middleware-Based Protection**
All admin routes protected with JWT authentication and role verification.

**2. Deactivated User Handling**
- Login endpoint returns 403 if user status is inactive
- All API endpoints verify user.status === 'active' via middleware
- Frontend clears localStorage and redirects to login on 403 response

**3. Role Validation**
- User role checked at both route-level (middleware) and controller-level (double validation)
- Admin role cannot be selected during registration (enforced by frontend + backend)

---

## API Architecture

### Endpoint Structure

```
/api
├── /auth
│   ├── POST   /register           # Create new user account
│   ├── POST   /login              # Local email/password login
│   ├── GET    /google             # Initiate Google OAuth flow
│   ├── GET    /google/callback    # Google OAuth callback
│   └── POST   /logout             # Clear session
│
├── /student                        # Protected (student role)
│   ├── GET    /bookings           # Get student's own bookings
│   └── POST   /bookings           # Create new booking
│
├── /watchman                       # Protected (watchman role)
│   ├── GET    /bookings           # Get assigned bookings
│   └── PUT    /bookings/:id/status # Update booking status
│
└── /admin                          # Protected (admin role)
    ├── GET    /users              # Get all users
    ├── POST   /users/create       # Create user manually
    ├── PUT    /users/:id          # Update user details
    ├── PUT    /users/:id/status   # Activate/deactivate user
    ├── DELETE /users/:id          # Soft delete user
    ├── GET    /bookings           # Get all bookings
    ├── PUT    /bookings/:id/status # Update booking status
    ├── DELETE /bookings/:id       # Delete booking
    ├── GET    /locations          # Get all locations
    ├── POST   /locations          # Create location
    ├── PUT    /locations/:id      # Update location
    ├── DELETE /locations/:id      # Delete location
    ├── GET    /audit-logs         # View audit logs
    └── POST   /change-password    # Change admin password
```

### Controller-Service Pattern Example

```javascript
// Route Definition (routes/student.routes.js)
router.post('/bookings', authenticateJWT, requireRole('student'), bookingController.createBooking);

// Controller (controllers/booking.controller.js)
async createBooking(req, res) {
  const result = await bookingService.createBooking(req.body, req.user);
  res.status(result.status).json(result.body);
}

// Service (services/booking.service.js)
async createBooking(bookingData, user) {
  // Business logic: validation, conflict checking, database operations
  // Returns { status: 201, body: booking }
}
```

Benefits:
- Controllers stay thin (HTTP concerns only)
- Services are reusable and testable
- Clear separation of concerns

---

## Security Implementation

### Authentication
- Passwords: Hashed with bcrypt (10 salt rounds) before storage
- JWT Tokens: Signed with HS256 algorithm, verified on every protected route
- Google OAuth: Passport.js strategy with email domain validation (@bitsathy.ac.in)
- Session Management: Express-session for OAuth callback handling

### Authorization
- Role-based Middleware: requireRole(role) blocks unauthorized access at route level
- Double Validation: Controllers re-check user role and status
- Deactivation Handling: Inactive users blocked at login + API interceptor (frontend)

### Data Validation
- Email Domain: Backend regex enforces @bitsathy.ac.in
- Registration Number: Format validation (7376232IT286 pattern)
- Booking Conflicts: Same route + time checked before approval
- Mongoose Schemas: Field-level validation (required fields, enums, unique constraints)

### Audit Logging
Every admin action logged to AuditLog collection:
- User activation/deactivation
- Booking approvals/rejections
- User creation/deletion
- Password changes
- Login attempts (failed/blocked)

### Email Notifications
- Account activation/deactivation emails sent automatically
- OTP generation for password reset (future enhancement)
- Dev mode logs emails to console if SMTP not configured

---

## Known Limitations

1. **Single Admin System**
   - Only one admin account supported (intentional design for simplicity)
   - Additional admins require direct database modification
   - Workaround: Multi-admin can be added by removing pre-save hook in User model

2. **No Real-Time Notifications**
   - Booking status updates require page refresh
   - Watchman dashboard uses polling (manual refresh)
   - Impact: Slight delay in status visibility

3. **Email Service Requires SMTP**
   - Development mode logs emails to console instead of sending
   - Production deployment requires Gmail App Password or SMTP credentials
   - Workaround: Use service like SendGrid or AWS SES

4. **No Student Cancellation**
   - Students cannot cancel their own bookings
   - Only admin can reject/delete bookings
   - Reasoning: Prevents abuse and ensures accountability

5. **Local Database Only**
   - No built-in MongoDB Atlas support (requires manual .env update)
   - Workaround: Replace MONGODB_URI with Atlas connection string

6. **No Payment Integration**
   - Free booking system (no cost tracking or billing)
   - Future enhancement for paid bookings

---

## Future Improvements

### High Priority
- Real-Time Notifications: WebSocket/Socket.io for instant status updates
- Student Booking Cancellation: Allow students to cancel pending bookings
- Email Service Enhancement: Integrate SendGrid or AWS SES for production
- Admin Dashboard Analytics: Booking trends, user statistics, usage graphs

### Medium Priority
- Multi-Admin Support: Hierarchical permissions (super-admin, sub-admin)
- SMS Notifications: Twilio integration for watchman alerts
- Booking History Export: CSV/PDF export for admin reports
- Advanced Search: Filter bookings by date range, user, location
- Location Maps: Google Maps integration for pickup/destination visualization

### Low Priority (Future Expansion)
- Mobile App: React Native for iOS/Android
- Payment Gateway: Stripe/Razorpay for paid bookings
- Vehicle Management: Track individual vehicles, maintenance schedules
- Rating System: Students rate watchman service quality
- API Rate Limiting: Prevent abuse with express-rate-limit

---

## Testing

Currently, no automated tests are implemented. Recommended testing strategy:

**Unit Tests** (Jest + Supertest)
- Service layer functions (booking creation, conflict detection)
- Authentication middleware
- Validation utilities

**Integration Tests**
- API endpoint workflows (register → login → create booking → approve)
- Role-based access control
- Database operations

**E2E Tests** (Cypress/Playwright)
- User registration → approval → booking creation flow
- Admin dashboard user management
- Watchman booking completion flow

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

**Coding Standards:**
- Follow existing folder structure (Controller-Service-Model pattern)
- Add comments for complex business logic
- Update README if adding new features or environment variables

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- BIT Sathy College: Original use case and requirements
- MERN Stack Community: Excellent documentation and resources
- TailwindCSS: Rapid UI development

---

## Support

For questions or issues:
- Open an issue on GitHub Issues
- Contact: yogeswaranv599@gmail.com

---

## Default Admin Account

Email: admin@bitsathy.ac.in

Note: Change the password immediately after first login via Admin Dashboard → Change Password

---

Built with the MERN stack by Yogeswaran V
