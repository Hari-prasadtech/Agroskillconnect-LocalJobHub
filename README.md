 #AgroSkillConnect

> A full stack web platform connecting local workers with employers across Kasaragod district,Kerala,India.
---

## 🔗 Live Demo
🌐 [View Live Project](#) <!-- Replace with your deployed Vercel/Render link -->  
📁 [GitHub Repository](#) <!-- Replace with your GitHub link -->

---

## 📌 Table of Contents
- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Default Test Accounts](#default-test-accounts)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Author](#author)

---

## 📖 About the Project

**AgroSkillConnect** is a full stack job matching platform that bridges the gap between local workers and employers in kasaragod district,Kerala. It supports three types of users — Workers, Employers, and Admins — each with their own dashboard and features.

Workers can browse and apply for jobs,employers can post and manage job listings,and admins can verify documents.

---

## ✨ Features

### 👤 Workers
- Register and verify email with OTP
- Browse and search available jobs
- Filter jobs by location, salary, and skills
- Apply for jobs and track application status
- Upload profile picture
- View employer profiles and company details

### 💼 Employers
- Post new job listings
- Manage and update job postings
- View and accept/reject worker applications
- Upload company logo
- View worker profiles

### 🛡️ Admin
- Approve or reject user accounts
- Verify user documents
- Manage all jobs and applications
- View system analytics dashboard
- Deactivate or delete users

### 🔧 General
- OTP-based email verification on registration
- JWT authentication
- Responsive design (mobile friendly)
- 10 pre-loaded demo jobs for testing
- Email notifications via Gmail (Nodemailer)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI Library |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Axios | HTTP Client |
| React Router v6 | Navigation |
| Recharts | Analytics Charts |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js (v18+) | Runtime |
| Native HTTP Server | Server |
| MongoDB | Database |
| Nodemailer | Email Sending |
| Anthropic Claude API | AI Document Verification |

---

## 📁 Project Structure

```
AgroSkillConnect/
├── client/                        # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── worker/            # Worker pages
│   │   │   ├── employer/          # Employer pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ...
│   │   ├── components/            # Reusable components
│   │   ├── contexts/              # Auth context
│   │   ├── utils/                 # Axios config, validation
│   │   ├── data/                  # Demo data, pincode data
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                        # Node.js backend
│   ├── src/
│   │   ├── index.js               # Main server file
│   │   └── reseed.js              # Database seeder
│   └── package.json
│
├── .env.example                   # Environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js v18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/agroskillconnect.git
cd agroskillconnect
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
PORT=5000
JWT_SECRET=your-secret-key
MONGO_URI=mongodb://127.0.0.1:27017/agroskill
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
CORS_ORIGIN=http://localhost:5173
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
```

### 4. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 5. Run the Application

**Terminal 1 — Start Backend:**
```bash
cd server
npm start
```
Backend runs on: `http://localhost:5000`

**Terminal 2 — Start Frontend:**
```bash
cd client
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🔑 Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Worker | worker@test.com | worker123 |
| Employer | employer@test.com | employer123 |

---

## 📋 API Endpoints

### Auth
```
POST   /api/auth/register           Register new user
POST   /api/auth/verify-otp         Verify email OTP
POST   /api/auth/login              Login user
```

### Users
```
GET    /api/users/profile           Get current user profile
PUT    /api/users/profile           Update profile
```

### Jobs
```
GET    /api/jobs                    List all approved jobs
POST   /api/jobs                    Create job (employer only)
GET    /api/jobs/:jobId             Get job details
PUT    /api/jobs/:jobId             Update job (employer only)
DELETE /api/jobs/:jobId             Delete job (employer only)
```

### Applications
```
GET    /api/applications            List user applications
POST   /api/applications            Submit application
PUT    /api/applications/:appId     Update application status
```

### Admin
```
GET    /api/admin/users             List all users
PUT    /api/admin/users/:userId     Update user status
DELETE /api/admin/users/:userId     Delete user
PUT    /api/admin/users/:userId/approve          Approve user
POST   /api/admin/users/:userId/verify-document  AI verify document
GET    /api/admin/jobs              List all jobs
PUT    /api/admin/jobs/:jobId/approve            Approve job
GET    /api/admin/applications      List all applications
```

### Employers
```
GET    /api/employers/:employerId   Get employer profile (for workers)
```

---

## 📸 Screenshots

<!-- Add your project screenshots here after deployment -->
| Page | Preview |
|------|---------|
| Landing Page | ![Landing](#) |
| Worker Dashboard | ![Worker](#) |
| Employer Dashboard | ![Employer](#) |
| Admin Dashboard | ![Admin](#) |

---

## ⚙️ Optional Configurations

### Email Notifications
Add Gmail credentials to `.env` to enable OTP emails and job alerts.
Use a [Gmail App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
cd server && rm -rf node_modules && npm install && npm start
```

**Frontend build errors:**
```bash
cd client && rm -rf node_modules && npm install && npm run dev
```

**Port already in use:**
- Edit `server/src/index.js` to change backend port
- Edit `client/vite.config.js` to change frontend port

---

## 👨‍💻 Author

**Hariprasad**  
📧 hariprasadk444@gmail.com  
🔗 [GitHub]()  

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ **If you found this project helpful, please give it a star on GitHub!** ⭐
