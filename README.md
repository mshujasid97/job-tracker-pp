# Job Tracker PP

A full-stack web application for tracking job applications with analytics, built with FastAPI and React.

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![React](https://img.shields.io/badge/react-19.2+-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20AI-blueviolet.svg)

> 🤖 **Built with AI Assistance**: This project is being developed with the assistance of [Claude](https://claude.ai), Anthropic's AI assistant, to demonstrate modern full-stack development practices and rapid prototyping capabilities.

## 🌐 Live Demo

**Try the application live:**
- **Frontend:** [https://job-tracker-pp.vercel.app](https://job-tracker-pp.vercel.app)
- **Backend API:** [https://job-tracker-api1.onrender.com](https://job-tracker-api1.onrender.com)
- **API Docs:** [https://job-tracker-api1.onrender.com/docs](https://job-tracker-api1.onrender.com/docs)

---

## 🎉 Version 1.1.0 Release

**Production hardening release** with security improvements, testing, and observability.

**What's New in V1.1:**
- ✅ Comprehensive test suite (45 tests, 97% coverage)
- ✅ Security headers middleware (XSS, clickjacking, CSP protection)
- ✅ Password validation (minimum 8 chars, uppercase, lowercase, digit)
- ✅ Rate limiting with Redis (brute-force & spam protection)
- ✅ Structured request and authentication logging

---

## 📦 Version 1.0.0

**Initial production-ready release** with complete functionality for managing job applications.

**What's in V1.0:**
- ✅ Complete authentication system with JWT
- ✅ Full CRUD operations for job applications
- ✅ Real-time dashboard analytics
- ✅ Manual search with button control (no focus loss)
- ✅ Flexible URL validation (accepts URLs with or without protocol)
- ✅ Polished UI with improved modals and uniform card layouts
- ✅ Instant analytics refresh on status changes
- ✅ Docker containerization for one-command deployment
- ✅ Comprehensive inline documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

Job Tracker PP is a personal job application management system that helps you organize and track your job search process. Keep track of where you've applied, interview statuses, and get insights into your job search progress with built-in analytics.

---

## ✨ Features

### Core Features (V1.0)
- ✅ **User Authentication** - Secure registration and login with JWT tokens
- ✅ **Job Application Management** - Create, read, update, and delete job applications
- ✅ **Status Tracking** - Track application progress (Applied → Screening → Interview → Offer → Accepted/Rejected)
- ✅ **Manual Search with Button** - Search applications by company name with explicit search button
- ✅ **Status Filtering** - Filter applications by status with dropdown selector
- ✅ **Archive System** - Archive old applications to keep your dashboard clean
- ✅ **Responsive Design** - Grid layout with mobile-friendly responsive breakpoints
- ✅ **Quick Status Updates** - Color-coded status badges with dropdown for instant updates
- ✅ **Flexible URL Input** - Accepts job posting URLs with or without protocol (auto-adds https://)
- ✅ **Real-time Analytics** - Dashboard statistics update immediately on status changes
- ✅ **Uniform Card Layout** - Edit/Delete buttons fixed at bottom regardless of content
- ✅ **Enhanced Modals** - Larger, more spacious forms (700px) with improved scrollbar styling
- ✅ **Comprehensive Documentation** - Inline comments and JSDoc throughout codebase

### Analytics Dashboard
- ✅ **Live Statistics** - Total applications, status breakdown, weekly/monthly counts
- ✅ **Success Rate Tracking** - Real-time calculation of acceptance rate
- ✅ **Instant Refresh** - Analytics update automatically on any application change
- ✅ **Timeline Data** - Application submission trends over customizable time periods
- 📊 **Visual Charts** - (Coming in V2.0) Interactive visualizations for analytics data

### UI/UX Improvements (V1.0)
- ✅ **Search Button Control** - Manual search prevents unwanted input focus loss
- ✅ **Clear Search Button** - Appears when search is active for quick reset
- ✅ **Custom Status Dropdowns** - Properly positioned arrows and color-coded badges
- ✅ **Flexbox Card Layout** - Consistent button positioning across all application cards
- ✅ **Cross-browser Scrollbars** - Styled scrollbars for Chrome, Firefox, and Safari
- ✅ **Enter Key Support** - Press Enter in search box to execute search

### Upcoming Features (V2.0+)
- 📧 Email reminders for follow-ups
- 📎 Document uploads (resume, cover letters)
- 📝 Rich text notes with formatting
- 📅 Interview scheduling and calendar integration
- 📤 Export data to CSV/PDF
- 📊 Interactive charts and visualizations
- 🔔 Browser notifications for important updates
- 🌙 Dark mode support

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI 0.109.0
- **Database:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt
- **Validation:** Pydantic
- **Server:** Uvicorn

### Frontend
- **Framework:** React 19.2
- **Bundler:** Vite 7.2.4
- **Routing:** React Router DOM 7.12.0
- **HTTP Client:** Axios 1.13.2
- **State Management:** React Context API
- **Styling:** CSS3 (no framework)

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database Management:** PostgreSQL in Docker
- **Version Control:** Git & GitHub

---

## 📁 Project Structure

```
job-tracker-pp/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   ├── applications.py # Application CRUD endpoints
│   │   │   └── analytics.py   # Analytics endpoints
│   │   ├── core/              # Core utilities
│   │   │   └── security.py    # JWT & password hashing
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py        # User model
│   │   │   └── application.py # Application model
│   │   ├── config.py          # Configuration settings
│   │   ├── database.py        # Database connection
│   │   └── main.py            # FastAPI app entry point
│   ├── tests/                 # Unit tests
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── README.md             # Backend documentation
│
├── frontend/                  # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Auth/        # Login & Register components
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── Auth.css
│   │   │   └── Dashboard/   # Dashboard components
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ApplicationList.jsx
│   │   │       ├── Dashboard.css
│   │   │       └── ApplicationList.css
│   │   ├── context/         # React Context (Auth)
│   │   │   └── AuthContext.jsx
│   │   ├── services/        # API service layer
│   │   │   └── api.js
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   └── .env.example        # Environment variables template
│
├── .gitignore
├── docker-compose.yml       # Docker orchestration
├── DOCKER.md               # Docker setup documentation
└── README.md               # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** and npm - [Download](https://nodejs.org/)
- **PostgreSQL 15** - [Download](https://www.postgresql.org/download/)
  - OR **Docker** - [Download](https://www.docker.com/products/docker-desktop) (recommended)
- **Git** - [Download](https://git-scm.com/downloads)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mshujasid97/job-tracker-pp.git
cd job-tracker-pp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
```

2. Edit `backend/.env` with your settings:

```env
# Database
DATABASE_URL=postgresql://jobtracker:password@localhost:5432/job_tracker

# Security (CHANGE THESE IN PRODUCTION!)
SECRET_KEY=your-super-secret-key-min-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (add your frontend URL)
CORS_ORIGINS=["http://localhost:5173"]

# Email (Optional - for reminders)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend Configuration

1. Create `.env` file in `frontend/` directory:

```bash
cp .env.example .env
```

2. Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🏃 Running the Application

### Option 1: Using Docker Compose (Recommended) 🐳

**Easiest way to run the entire application:**

```bash
# Start all services (database, backend, frontend)
docker-compose up

# Or run in background
docker-compose up -d

# Stop all services
docker-compose down
```

That's it! Everything runs with one command:
- ✅ PostgreSQL database
- ✅ FastAPI backend (http://localhost:8000)
- ✅ React frontend (http://localhost:5173)

For detailed Docker documentation, see [DOCKER.md](DOCKER.md)

### Option 2: Manual Setup

```bash
# Start PostgreSQL database
docker run --name job-tracker-db \
  -e POSTGRES_USER=jobtracker \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=job_tracker \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

### Option 2: Local PostgreSQL

If you have PostgreSQL installed locally:

```sql
CREATE DATABASE job_tracker;
CREATE USER jobtracker WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE job_tracker TO jobtracker;
```

### Start Backend

```bash
# From backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run the server
uvicorn app.main:app --reload
```

Backend will be available at: **http://localhost:8000**

### Start Frontend

Open a **new terminal**:

```bash
# From frontend directory
cd frontend

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

#### Applications
- `GET /api/applications` - List all applications (with filters)
- `POST /api/applications` - Create new application
- `GET /api/applications/{id}` - Get single application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application
- `PATCH /api/applications/{id}/archive` - Toggle archive status

#### Analytics
- `GET /api/analytics/summary` - Get summary statistics
- `GET /api/analytics/timeline` - Get timeline data

---

## 🗄 Database Schema

### Users Table
```sql
id              UUID PRIMARY KEY
email           VARCHAR UNIQUE NOT NULL
hashed_password VARCHAR NOT NULL
full_name       VARCHAR NOT NULL
role            ENUM('user', 'admin') DEFAULT 'user'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Applications Table
```sql
id              UUID PRIMARY KEY
user_id         UUID FOREIGN KEY → users.id
company_name    VARCHAR NOT NULL
job_title       VARCHAR NOT NULL
status          ENUM('applied', 'screening', 'interview', 'offer', 'accepted', 'rejected')
date_applied    DATE NOT NULL
job_url         VARCHAR
notes           TEXT
is_archived     BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🏗 Architecture

### Backend Architecture
- **MVC Pattern** with separation of concerns
- **Repository Pattern** for database operations
- **Dependency Injection** for database sessions and auth
- **JWT-based Authentication** with secure password hashing
- **RESTful API** design following best practices

### Frontend Architecture
- **Component-based** React architecture
- **Context API** for global state management (Auth)
- **Protected Routes** for authenticated pages
- **Service Layer** for API communication
- **Responsive Design** for mobile and desktop

### Security Features
- Password hashing with bcrypt
- JWT token-based authentication
- HTTP-only cookies (ready for implementation)
- CORS protection
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic

---

## 👨‍💻 Development

### Backend Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Check code style
flake8 app/
```

### Frontend Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Style
- **Backend:** PEP 8 (Python style guide)
- **Frontend:** ESLint + Prettier (JavaScript/React)

---

## 🚢 Deployment

### Backend Deployment (Render/Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy!

### Frontend Deployment (Vercel/Netlify)

1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variables
5. Deploy!

### Environment Variables for Production

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Random 32+ character string
- `CORS_ORIGINS` - Your frontend URL

**Frontend:**
- `VITE_API_URL` - Your backend API URL

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👤 Author

**Shuja**

- Project Link: [https://github.com/mshujasid97/job-tracker-pp](https://github.com/mshujasid97/job-tracker-pp)

### Development Approach

This project showcases modern full-stack development with AI assistance:
- **Rapid Prototyping**: Leveraging Claude AI to accelerate development workflow
- **Best Practices**: Following industry-standard patterns for both backend and frontend
- **Comprehensive Documentation**: Inline comments and JSDoc throughout the codebase
- **Production-Ready**: Docker containerization and deployment-ready configuration
- **Iterative Development**: V1.0 represents complete feature set with polished UX

### Version History

**V1.0.0** (January 2026)
- Initial production release
- Complete authentication and application management
- Real-time analytics dashboard
- Manual search with button control
- Flexible URL validation
- UI/UX polish and bug fixes
- Docker containerization
- Comprehensive documentation

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - JavaScript library for building UIs
- [PostgreSQL](https://www.postgresql.org/) - Powerful open-source database
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Claude AI](https://claude.ai) - AI assistant by Anthropic used in building this project

---

## 📧 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the API documentation at `/docs`
- Review the [Installation](#installation) section

---

**Happy Job Hunting! 🎯**