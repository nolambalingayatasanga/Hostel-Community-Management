# Hostel Community Management System

A production-quality, full-stack web application designed to manage community details for students, alumni, parents/agents, staff wardens, and board members. The system features a responsive React dashboard, RESTful Node/Express APIs, Mongoose/MongoDB, secure JWT authentication, and Cloudinary media integration.

---

## Features

1. **Dual-Identifier Authentication**: Log in with either **Email** OR **Phone Number** and password.
2. **Role-Based Access Control (RBAC)**: Supports 6 distinct community roles:
   - `ADMIN` (Warden/Chairperson - unrestricted controls)
   - `MEMBER` (Authority Board Members)
   - `STAFF` (Hostel Staff/Assistant Wardens)
   - `AGENT` (Voting-eligible parent representatives)
   - `STUDENT` (Currently studying residents)
   - `ALUMNI` (Graduated seniors with career profiles)
3. **Data Privacy Layer**: Dynamically hides sensitive details (email, phone, address, DOB) from unauthorized roles (e.g., students browsing other students' profile cards), while allowing complete views for Admins/Members.
4. **Student-to-Alumni Transition**: Preserves graduation timelines and education history while shifting users into Alumni roles, prompting them for their new job designations and industries.
5. **Real-time Analytics Dashboard**: Charts (roles breakdown, age distribution, locations, college/company counts) calculated directly from real MongoDB aggregations.
6. **Community Events Calendar**: Allows scheduling upcoming gatherings, sorting by date, upload of cover photos, and gallery images.

---

## Project Structure

```text
HostelMang/
├── server/                 # Express.js Backend
│   ├── config/             # DB & Cloudinary Configuration
│   ├── controllers/        # Route Handlers
│   ├── middleware/         # JWT Verification, RBAC, Privacy Sanitization, Multer
│   ├── models/             # User and Event Mongoose Schemas
│   ├── routes/             # REST Endpoints
│   ├── utils/              # Console Mailer
│   ├── app.js              # Express Config
│   ├── server.js           # Server Port Initialization
│   └── seed.js             # Database Development Seeding Script
├── src/                    # React.js Vite Frontend
│   ├── api/                # Axios Client Instance with Interceptors
│   ├── components/         # Reusable Panels, locked directories, dialogs
│   ├── context/            # AuthContext (Me session retrieval)
│   ├── layouts/            # DashboardLayout Drawer Sidebar
│   ├── pages/              # Auth, Profile, Dashboards, and Event lists
│   ├── routes/             # ProtectedRoute
│   ├── theme.js            # Outfits Font Dark Mode configuration
│   ├── App.jsx             # Main Router
│   └── main.jsx            # Entrypoint
├── .env                    # Local Configuration
├── .env.example            # Environment template
└── package.json            # Root workspace definitions
```

---

## Environment Variables Configuration

Create a `.env` file in the root directory based on the `.env.example` file:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hostel-community

JWT_SECRET=some_super_secret_jwt_key_12345
JWT_EXPIRES_IN=7d

# Cloudinary Credentials (leave empty to fallback to local placeholder assets)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email SMTP Settings (leave empty to log password resets to server terminal console)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASSWORD=

FRONTEND_URL=http://localhost:5173
```

---

## Installation & Running

### 1. Install Dependencies

At the root directory:
```bash
npm install
```

In the `server/` directory:
```bash
cd server
npm install
cd ..
```

### 2. Seed the Database

To clear the database and populate default accounts (Admin, Students, Alumni, Staff, Events):
```bash
npm run seed
```

*Note: Default seeded credentials will be printed to the terminal console upon completion.*

### 3. Run Development Servers

Run the backend server (starts on Port 5000 by default):
```bash
npm run server
```

Run the Vite React frontend (starts on http://localhost:5173 by default):
```bash
npm run dev
```

---

## Seed login credentials

The database seed script sets up the following initial accounts:

- **Admin User**:
  - Email: `admin@hostelcomm.org` OR Phone: `9988776655`
  - Password: `AdminPassword123!`
- **Student User**:
  - Email: `amit.student@hostelcomm.org` OR Phone: `9876543210`
  - Password: `StudentPassword123!`
- **Alumni User**:
  - Email: `nikhil.alumni@hostelcomm.org` OR Phone: `9876543212`
  - Password: `AlumniPassword123!`
