# Smart Community Service & Complaint Management System

A full-stack web application for reporting, tracking and resolving community
issues (water leakage, electrical faults, sanitation, security, maintenance,
etc.). Built for the National Abilympics Computer Programming project.

- **Frontend:** React 18 + Vite + React Router (web)
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MongoDB (Atlas)
- **Auth:** JWT (Bearer token)
- **Uploads:** Complaint evidence & work-completion images (Multer)

> Note: The brief's header lists React Native, but the detailed instructions and
> this implementation use **React for the web**, matching the requested
> React + Express + MongoDB stack.

---

## Features by role

### User
Register / login, submit complaints with a photo, auto-generated ticket ID
(`CMP-YYYY-NNNNNN`), track status via a timeline, search & filter their
complaints, and give a 1–5 star rating after resolution.

### Staff
See complaints assigned to them, accept a task, mark it in progress, add
remarks, upload a work-completion photo and mark it resolved or rejected.

### Administrator
Dashboard with statistics (totals, by status/category/priority, average
rating), view & filter all complaints, assign complaints to staff, change
priority, and manage users/staff (add staff, change roles, activate/deactivate).

---

## Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster (credentials are already set in `backend/.env`)

### Important: MongoDB Atlas IP access list

The backend connects to MongoDB Atlas. Atlas only accepts connections from
IP addresses on its access list. If you see
`Could not connect to any servers in your MongoDB Atlas cluster`:

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access**.
2. Click **Add IP Address** → **Add Current IP Address**
   (or **Allow Access from Anywhere** `0.0.0.0/0` for local development only).
3. Wait ~1 minute for it to activate, then retry.

Home/office IPs are often dynamic, so you may need to re-add your current IP if
it changes.

---

## Setup & run

Open two terminals.

### 1. Backend

```bash
cd backend
npm install
npm run seed    # one-time: loads Indian sample users, staff & complaints
npm start       # starts the API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # starts the app on http://localhost:5173
```

Open http://localhost:5173 in your browser. The Vite dev server proxies
`/api` and `/uploads` to the backend on port 5000, so no extra config is needed.

---

## Demo accounts

All seeded accounts share the password **`password123`**.

| Role  | Email                 | Name            |
|-------|-----------------------|-----------------|
| Admin | admin@community.in    | Rajesh Kumar    |
| Staff | suresh@community.in   | Suresh Nair (Electrical) |
| Staff | anjali@community.in   | Anjali Deshmukh (Plumbing) |
| User  | priya@community.in    | Priya Sharma    |
| User  | arjun@community.in    | Arjun Reddy     |

(Additional staff and users are also seeded — see the console output of
`npm run seed`.)

---

## Project structure

```
Community Service/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection
│   │   ├── models/                 # User, Complaint (timeline, feedback)
│   │   ├── middleware/             # auth, error handling, multer upload
│   │   ├── controllers/            # auth, complaint, admin logic
│   │   ├── routes/                 # /api/auth, /api/complaints, /api/admin
│   │   ├── utils/                  # jwt, validation helpers
│   │   ├── seed/seed.js            # sample data (Indian names)
│   │   ├── app.js                  # Express app
│   │   └── server.js               # entry point
│   ├── uploads/                    # uploaded images (created at runtime)
│   └── .env                        # MONGODB_URI, JWT_SECRET, CLIENT_ORIGINS
└── frontend/
    ├── src/
    │   ├── api/                     # axios client + service wrappers
    │   ├── context/AuthContext.jsx  # auth state
    │   ├── components/              # shared UI (cards, badges, states, actions)
    │   ├── hooks/useComplaints.js   # list fetching hook
    │   ├── pages/                   # user / staff / admin screens
    │   ├── App.jsx                  # routes
    │   └── styles.css               # design system
    └── vite.config.js               # dev proxy to backend
```

---

## REST API overview

| Method | Endpoint                         | Role        | Purpose                           |
|--------|----------------------------------|-------------|-----------------------------------|
| POST   | `/api/auth/register`             | public      | Register a user                   |
| POST   | `/api/auth/login`                | public      | Login, returns JWT                |
| GET    | `/api/auth/me`                   | any         | Current profile                   |
| GET    | `/api/complaints`                | any         | List (role-scoped) + search/filter|
| POST   | `/api/complaints`                | user        | Create complaint (+ image)        |
| GET    | `/api/complaints/:id`            | any         | Complaint details                 |
| PUT    | `/api/complaints/:id/assign`     | admin       | Assign to staff + priority        |
| PUT    | `/api/complaints/:id/priority`   | admin       | Change priority                   |
| PUT    | `/api/complaints/:id/status`     | staff/admin | Update status (+ completion image)|
| POST   | `/api/complaints/:id/feedback`   | user (owner)| Submit 1–5 rating                 |
| GET    | `/api/admin/stats`               | admin       | Dashboard statistics              |
| GET    | `/api/admin/users`               | admin       | List accounts                     |
| POST   | `/api/admin/staff`               | admin       | Create staff account              |
| PATCH  | `/api/admin/users/:id/role`      | admin       | Change role                       |
| PATCH  | `/api/admin/users/:id/active`    | admin       | Activate / deactivate             |

---

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- Every protected route verifies a JWT; role-based middleware guards
  admin/staff actions, and object-level checks ensure users only see their own
  complaints and staff only their assigned ones.
- File uploads are restricted to images (allowlist of MIME type + extension)
  and capped at 5 MB.
- Validation is applied on both the client and the server.
- Error responses are generic; detailed errors are logged server-side only.

> For a real deployment: move secrets out of `backend/.env` into a secrets
> manager, serve over HTTPS, and restrict the Atlas access list to known IPs.
```
