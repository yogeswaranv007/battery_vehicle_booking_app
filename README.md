# Battery Vehicle Booking System

A full-stack web application for managing battery vehicle bookings at BIT Sathy College. Built with the MERN stack (MongoDB, Express, React, Node.js), featuring role-based authentication, admin approval, and time/location-based booking.

## Features
- Student, Watchman, and Single Admin roles
- Secure registration and login (JWT, Google OAuth)
- Admin approval for watchmen
- Time-based booking with pickup (from place) and destination
- Watchman dashboard for managing and completing bookings
- Admin dashboard for user and booking management
- Password change for admin
- Responsive UI with Tailwind CSS

## Folder Structure
```
Booking_app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── server.js
│   │   ├── seedAdmin.js
│   ├── .env
│   ├── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
├── SINGLE_ADMIN_SYSTEM.md
├── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your secrets
node src/seedAdmin.js # Creates default admin account
node src/server.js     # Starts backend server
```

### Frontend Setup
```bash
cd frontend
npm install
npm start # Starts React development server
```

### Environment Variables
- See `.env.example` in backend for required variables (MONGODB_URI, JWT_SECRET, etc.)
- Do NOT commit your real .env file to GitHub

## Usage
- Register as Student or Watchman
- Admin approves watchmen
- Students book vehicles (choose time, from place, destination)
- Watchman sees pending/completed bookings, marks as completed
- Admin manages users/bookings, changes password

## Contributing
Pull requests welcome! Please open issues for bugs or feature requests.

## License
[MIT] (add your license here)

---
For full admin system details, see `SINGLE_ADMIN_SYSTEM.md`.
