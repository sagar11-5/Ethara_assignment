# Team Task Management Web Application

A full-stack collaborative task management web application where teams can create projects, assign tasks, track progress, and manage workflows efficiently.

This project is inspired by tools like Trello and Asana.

---

# Live Demo

## Frontend
Add your deployed frontend URL here.

Example:
```bash
https://team-task-manager-production.up.railway.app
```

## Backend API
Add your backend API URL here.

Example:
```bash
https://team-task-api-production.up.railway.app
```

---

# GitHub Repository

Add your GitHub repository link here.

Example:
```bash
https://github.com/your-username/team-task-manager
```

---

# Features

## Authentication
- User Signup
- User Login
- JWT Authentication
- Protected Routes
- Password Hashing

## Project Management
- Create Projects
- Add Members
- Remove Members
- Admin Role Management

## Task Management
- Create Tasks
- Assign Tasks
- Update Task Status
- Set Due Dates
- Set Priorities

## Dashboard
- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks
- Task Analytics

## Role-Based Access
### Admin
- Manage users
- Manage tasks
- Manage projects

### Member
- View assigned tasks
- Update assigned tasks only

---

# Tech Stack

## Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router DOM

## Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs

## Database
- MongoDB Atlas
- Mongoose

## Deployment
- Railway
- Vercel (optional)

---

# Folder Structure

```bash
project-root/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── App.jsx
│   └── vite.config.js
│
└── README.md
```

---

# Installation Guide

# 1. Clone Repository

```bash
git clone https://github.com/your-username/team-task-manager.git
```

---

# 2. Backend Setup

```bash
cd backend
npm install
```

## Create `.env` file

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_SECRET_KEY
CLIENT_URL=http://localhost:5173
```

## Run Backend

```bash
npm run dev
```

Backend runs on:
```bash
http://localhost:5000
```

---

# 3. Frontend Setup

```bash
cd frontend
npm install
```

## Create `.env` file

```env
VITE_API_URL=http://localhost:5000
```

## Run Frontend

```bash
npm run dev
```

Frontend runs on:
```bash
http://localhost:5173
```

---

# API Endpoints

# Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register User |
| POST | /api/auth/login | Login User |

---

# Project APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/projects | Create Project |
| GET | /api/projects | Get All Projects |
| PUT | /api/projects/:id | Update Project |
| DELETE | /api/projects/:id | Delete Project |

---

# Task APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/tasks | Create Task |
| GET | /api/tasks | Get Tasks |
| PUT | /api/tasks/:id | Update Task |
| DELETE | /api/tasks/:id | Delete Task |

---

# Database Models

# User Model

```js
{
  name,
  email,
  password,
  role
}
```

# Project Model

```js
{
  name,
  description,
  admin,
  members
}
```

# Task Model

```js
{
  title,
  description,
  dueDate,
  priority,
  status,
  assignedTo,
  project
}
```

---

# Environment Variables

# Backend

```env
PORT=
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
```

# Frontend

```env
VITE_API_URL=
```

---

# Railway Deployment

# Backend Deployment

1. Push backend code to GitHub
2. Login to Railway
3. Create New Project
4. Deploy from GitHub
5. Add Environment Variables
6. Deploy Application

Use:
https://railway.app

---

# Frontend Deployment

1. Push frontend code to GitHub
2. Deploy on Railway or Vercel
3. Add frontend environment variables
4. Connect frontend with backend

---

# Screenshots

Add screenshots of:
- Login Page
- Dashboard
- Project Page
- Task Board
- Analytics

Example:

```md
![Dashboard Screenshot](./screenshots/dashboard.png)
```

---

# Future Enhancements

- Real-time notifications
- Drag and drop tasks
- File uploads
- Team chat
- Email reminders
- Dark mode
- Activity logs
- Calendar integration

---

# Security Features

- JWT Authentication
- Password Hashing
- Protected APIs
- Role-Based Authorization
- Environment Variables
- Secure Database Connection

---

# Production Improvements

- Refresh Tokens
- API Rate Limiting
- Helmet Security
- Swagger Documentation
- CI/CD Pipeline
- Docker Support

---

# Learning Outcomes

This project demonstrates:
- Full Stack Development
- REST API Development
- Authentication & Authorization
- Database Relationships
- Frontend State Management
- Deployment & Hosting
- Real-world Team Collaboration Features

---

# Author

## Your Name
Add your name here.

Example:
```bash
Sagar Sharma
```

---

# License

This project is licensed under the MIT License.

---

# Acknowledgements

- MongoDB Atlas
- Railway
- React.js
- Express.js
- Tailwind CSS
- Node.js
- JWT Authentication
