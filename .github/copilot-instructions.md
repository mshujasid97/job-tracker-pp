# AI Copilot Instructions for Job Tracker

## Project Overview
**Smart Job Application Tracker** - A full-stack application for tracking job applications with JWT authentication, PostgreSQL persistence, and real-time analytics.

**Tech Stack**: FastAPI (Python) backend, React frontend, PostgreSQL database, JWT authentication.

## Architecture & Data Flow

### Backend Structure (`backend/app/`)
- **Models** (`models/`): SQLAlchemy ORM models for `User` and `Application` entities with cascading relationships
- **API Routes** (`api/`): RESTful endpoints organized by domain (auth, applications, analytics)
- **Core** (`core/security.py`): JWT token handling and password hashing utilities
- **Database** (`database.py`): SQLAlchemy session factory with dependency injection pattern
- **Config** (`config.py`): Pydantic BaseSettings for environment-based configuration

### Authentication & Authorization
- **Pattern**: OAuth2 with JWT tokens (HS256 algorithm)
- **Entry Point**: `api/auth.py` contains `get_current_user()` dependency used across protected routes
- **Token Flow**: User registers/logs in → JWT issued → included in Authorization header for subsequent requests
- **Key File**: [backend/app/core/security.py](backend/app/core/security.py) - All JWT and password operations
- **Session Dependency**: `get_db()` in [backend/app/database.py](backend/app/database.py) - Inject database sessions into route handlers

### Data Model Pattern
- **User**: Stores credentials (hashed), full name, role (user/admin); one-to-many relationship with Applications
- **Application**: Job application record with status enum (applied→screening→interview→offer→accepted/rejected)
- **Cascading Deletes**: Deleting a user automatically deletes their applications (`cascade="all, delete-orphan"`)
- **Indexing**: `email` (User), `company_name` and `status` (Application) are indexed for query performance

## API Design Patterns

### Route Implementation Pattern
1. Define Pydantic schemas (Create/Update/Response) in the route file
2. Use `Depends(get_current_user)` to require authentication
3. Use `Depends(get_db)` to inject SQLAlchemy session
4. Filter queries by `current_user.id` for multi-tenancy
5. Use `response_model` type hints for automatic validation

**Example** from [backend/app/api/applications.py](backend/app/api/applications.py):
```python
@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(
    status: Optional[ApplicationStatus] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application).filter(
        Application.user_id == current_user.id  # Always filter by user
    )
```

### Status Enum Pattern
ApplicationStatus is a Python enum; always validate at model level. When querying by status, use the enum type directly (e.g., `Application.status == ApplicationStatus.INTERVIEW`).

## Configuration & Environment

**Pattern**: All config lives in [backend/app/config.py](backend/app/config.py) using Pydantic Settings with `.env` file support.

**Key Variables**:
- `DATABASE_URL`: PostgreSQL connection (default: localhost, user: jobtracker)
- `SECRET_KEY`: JWT signing key (change in production)
- `CORS_ORIGINS`: Frontend URLs allowed (default: localhost:5173, localhost:3000)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT expiry (default: 30)

**Setup**: Copy `.env.example` to `.env` and configure before running.

## Development Workflows

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
- FastAPI auto-reloads on file changes
- Swagger docs available at `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/health`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
- Uses Alembic for migrations (migrations stored in `backend/alembic/versions/`)
- Tables auto-created on app startup via `Base.metadata.create_all(bind=engine)`
- Run migrations with `alembic upgrade head` (after setup)

### Testing
Tests directory exists but is empty; add pytest tests following FastAPI testing patterns:
- Use `TestClient` from `fastapi.testclient`
- Mock database with test session
- Create fixtures for test users and applications

## Key Patterns & Conventions

### Multi-Tenancy
Every query must filter by `current_user.id`. This is enforced via the dependency injection pattern—never query without user context.

### Relationship Management
Use SQLAlchemy relationships for bidirectional access:
- `user.applications` returns all applications for a user
- `application.user` returns the application's owner
- Always use `cascade="all, delete-orphan"` for owned relationships

### Error Handling
Use FastAPI HTTPException with appropriate status codes:
- `400`: Bad request (invalid schema)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found

### CORS Configuration
CORS is middleware-based and configured globally in [backend/app/main.py](backend/app/main.py). Update `settings.CORS_ORIGINS` to add frontend URLs.

### Dependencies Organization
- Shared dependencies (auth, database) are imported from `api.auth` and `database` modules
- Create new dependencies as functions with `Depends()` for reusability
- Avoid circular imports—import dependencies only where used

## Integration Points

### Frontend-Backend Communication
- Base URL: `http://localhost:8000` (configure in `.env`)
- All requests require `Authorization: Bearer <token>` header except `/api/auth/register` and `/api/auth/login`
- APIs return JSON; frontend handles parsing via Axios or fetch

### External Dependencies
- **Database**: PostgreSQL (psycopg2-binary driver)
- **Async Tasks** (optional): Celery + Redis for background jobs (configured in requirements but not fully integrated)
- **Email** (optional): SMTP configuration available in settings for future notifications

## File Conventions

- Schemas (Pydantic models) defined in route files, not separate schema files
- No database ORM queries in API route handlers—query in separate service layer if needed
- Environment variables use UPPER_SNAKE_CASE
- UUID primary keys throughout (PostgreSQL UUID type with Python uuid.uuid4)

## Common Tasks

### Adding a New Application Field
1. Add column to `Application` model in [backend/app/models/application.py](backend/app/models/application.py)
2. Add field to `ApplicationCreate` and `ApplicationResponse` schemas in [backend/app/api/applications.py](backend/app/api/applications.py)
3. Update route handlers if filtering/sorting needed
4. Create Alembic migration: `alembic revision --autogenerate -m "Add field_name"`

### Protecting a Route
Use `Depends(get_current_user)` in route signature to require valid JWT token.

### Debugging
- Enable `DEBUG = True` in `.env` for detailed error messages
- Check `uvicorn` console output for query logs
- Use FastAPI Swagger UI (`/docs`) to test endpoints interactively
