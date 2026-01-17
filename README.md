\# Smart Job Application Tracker



A full-stack web application to track job applications.



\## Tech Stack

\- \*\*Backend:\*\* FastAPI, PostgreSQL, SQLAlchemy, JWT Authentication

\- \*\*Frontend:\*\* React, Axios, React Router

\- \*\*Auth:\*\* JWT



\## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment variables
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API Documentation
Once running, visit: http://localhost:8000/docs

## Author
Muhammad Shuja