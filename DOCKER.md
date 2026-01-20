# Docker Setup Guide

This document explains how to run the Job Tracker application using Docker and Docker Compose.

## Prerequisites

- **Docker Desktop** installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - Verify installation: `docker --version` and `docker-compose --version`

## Quick Start

### Run Everything with One Command

```bash
# Start all services (database, backend, frontend)
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

That's it! 🎉

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Stop Everything

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

---

## Docker Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Compose Network              │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Frontend   │  │   Backend    │        │
│  │   (React)    │──│  (FastAPI)   │        │
│  │  Port: 5173  │  │  Port: 8000  │        │
│  └──────────────┘  └──────┬───────┘        │
│                            │                │
│                    ┌───────▼────────┐       │
│                    │   PostgreSQL   │       │
│                    │   Port: 5432   │       │
│                    └────────────────┘       │
└─────────────────────────────────────────────┘
```

---

## Services Explained

### 1. PostgreSQL (Database)
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Data:** Stored in Docker volume (persists after restart)
- **Credentials:** 
  - User: `jobtracker`
  - Password: `password`
  - Database: `job_tracker`

### 2. Backend (FastAPI)
- **Build:** From `backend/Dockerfile`
- **Port:** 8000
- **Hot Reload:** Code changes auto-reload
- **Dependencies:** Installed from `requirements.txt`

### 3. Frontend (React)
- **Build:** From `frontend/Dockerfile`
- **Port:** 5173
- **Hot Reload:** Code changes auto-reload
- **Dependencies:** Installed from `package.json`

---

## Common Commands

### View Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow logs (live)
docker-compose logs -f backend
```

### Restart a Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild After Code Changes
```bash
# Rebuild all services
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Execute Commands in Containers
```bash
# Access backend shell
docker-compose exec backend bash

# Access PostgreSQL
docker-compose exec postgres psql -U jobtracker -d job_tracker

# Run backend commands
docker-compose exec backend python -c "print('Hello from Docker!')"
```

### Stop Individual Services
```bash
docker-compose stop backend
docker-compose stop frontend
```

### Start Individual Services
```bash
docker-compose start backend
docker-compose start frontend
```

---

## Development Workflow

### Option 1: Full Docker (Recommended for Portfolio)
```bash
# Start everything
docker-compose up

# Code changes auto-reload
# Work normally in VS Code
```

### Option 2: Hybrid (Database in Docker, Apps Local)
```bash
# Start only database
docker-compose up postgres

# Run backend locally
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Run frontend locally
cd frontend
npm run dev
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
# Windows PowerShell:
netstat -ano | findstr :8000
netstat -ano | findstr :5173
netstat -ano | findstr :5432

# Mac/Linux:
lsof -i :8000
lsof -i :5173
lsof -i :5432

# Then stop the conflicting service or change ports in docker-compose.yml
```

### Container Won't Start
```bash
# View detailed logs
docker-compose logs backend

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down
docker-compose up --build
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker-compose ps

# Access database directly
docker-compose exec postgres psql -U jobtracker -d job_tracker

# Reset database
docker-compose down -v
docker-compose up
```

### "Module not found" Errors
```bash
# Backend - reinstall dependencies
docker-compose down
docker-compose up --build backend

# Frontend - clear node_modules
docker-compose down
rm -rf frontend/node_modules
docker-compose up --build frontend
```

### Complete Reset
```bash
# Nuclear option - delete everything and start fresh
docker-compose down -v
docker system prune -a
docker-compose up --build
```

---

## Production Deployment

For production, you'd create a separate `docker-compose.prod.yml`:

### Key Differences for Production:
1. **Frontend:** Build static files instead of dev server
2. **Backend:** Remove `--reload` flag
3. **Environment:** Use production environment variables
4. **Secrets:** Store in secure secret manager, not in docker-compose
5. **Reverse Proxy:** Add Nginx to serve frontend and proxy backend
6. **SSL:** Add HTTPS certificates

---

## Data Persistence

### Database Data
- Stored in Docker volume: `postgres_data`
- Persists even after `docker-compose down`
- Only deleted with `docker-compose down -v`

### View Volumes
```bash
docker volume ls
docker volume inspect job-tracker-pp_postgres_data
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U jobtracker job_tracker > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U jobtracker job_tracker < backup.sql
```

---

## Environment Variables

Current setup uses hardcoded values in `docker-compose.yml` for simplicity.

### For Production:
Create `.env` file in root:
```env
POSTGRES_USER=jobtracker
POSTGRES_PASSWORD=super-secret-password
POSTGRES_DB=job_tracker
SECRET_KEY=random-32-char-secret-key
```

Then update `docker-compose.yml` to use `${VARIABLE_NAME}` syntax.

---

## Benefits of This Docker Setup

✅ **One Command Deployment** - `docker-compose up`  
✅ **Consistent Environment** - Same on all machines  
✅ **Isolated Dependencies** - No conflicts with other projects  
✅ **Easy Onboarding** - New developers start instantly  
✅ **Production-Like** - Mirrors production environment  
✅ **Portfolio Ready** - Shows DevOps knowledge  

---

## Next Steps

1. Customize environment variables in `docker-compose.yml`
2. Add `.env` file for sensitive data
3. Create `docker-compose.prod.yml` for production
4. Set up CI/CD pipeline with Docker
5. Deploy to cloud platforms (AWS ECS, Google Cloud Run, etc.)

---

**Happy Dockerizing! 🐳**