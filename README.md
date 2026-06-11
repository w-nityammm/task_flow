# TaskFlow

A full-stack task management application with real-time updates, JWT authentication, role-based access control, and a modern glassmorphism UI.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS v4 |
| **Backend** | Go 1.24 · Gin framework |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT in httpOnly cookies · bcrypt |
| **Real-time** | Server-Sent Events (SSE) |
| **DevOps** | Docker Compose · GitHub Actions CI |

## Features

- **Task CRUD** — Create, list, update, delete tasks with title, description, status, priority, due date
- **Search & Filter** — Filter by status/priority, full-text search, sort by date/priority
- **Pagination** — Configurable page size with smart windowed pagination
- **JWT Auth** — Signup/login with bcrypt hashing, httpOnly cookie persistence
- **Real-time SSE** — Live task updates pushed to connected clients
- **Optimistic UI** — Instant state updates with rollback on server failure
- **Activity Log** — Change history timeline per task
- **Admin RBAC** — Admin role can view all users' tasks
- **Dark Mode** — Persisted theme toggle (dark/light)
- **Docker Compose** — One-command local setup
- **Tests** — Go unit + integration tests; Jest frontend hook tests
- **CI Pipeline** — GitHub Actions on push/PR

---

## Quick Start (Docker Compose)

```bash
# Clone and enter directory
git clone <repo-url>
cd task_manager

# (Optional) set a custom JWT secret
export JWT_SECRET="your-production-secret"

# Start all services
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

---

## Manual Setup

### Prerequisites
- Go 1.24+
- Node.js 20+
- PostgreSQL 16

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

go mod download
go run ./cmd/api
```

The server auto-runs SQL migrations on startup.

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `8080` |
| `ENV` | `development` or `production` | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | JWT signing secret (keep secret!) | — |
| `JWT_EXPIRY_HOURS` | Token expiry in hours | `72` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8080/api/v1` |

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Create account |
| `POST` | `/api/v1/auth/login` | Sign in |
| `POST` | `/api/v1/auth/logout` | Sign out |
| `GET` | `/api/v1/auth/me` | Get current user |

### Tasks (requires auth cookie)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tasks` | Create a task |
| `GET` | `/api/v1/tasks` | List tasks (filter/search/sort/paginate) |
| `GET` | `/api/v1/tasks/:id` | Get a single task |
| `PATCH` | `/api/v1/tasks/:id` | Update a task |
| `DELETE` | `/api/v1/tasks/:id` | Delete a task |
| `GET` | `/api/v1/tasks/:id/activity` | Get activity log |
| `GET` | `/api/v1/tasks/stream` | SSE real-time stream |

#### Task Query Parameters
```
status=todo|in_progress|done
priority=low|medium|high
search=<string>
sort_by=created_at|due_date|priority
order=asc|desc
page=1
limit=20
```

### Admin (requires role=admin)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/tasks` | List all users' tasks |

---

## Running Tests

### Backend
```bash
cd backend
# Unit tests only (no database needed)
go test ./tests/... -run "TestHash|TestGenerate" -v

# All tests (requires TEST_DATABASE_URL)
TEST_DATABASE_URL="postgres://..." go test ./tests/... -v
```

### Frontend
```bash
cd frontend
npm test
```

---

## Admin Access

The admin role must be set directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Project Structure

```
task_manager/
├── backend/
│   ├── cmd/api/main.go          # Entry point
│   ├── internal/
│   │   ├── config/              # Env var loading
│   │   ├── database/            # DB connection + migrations
│   │   ├── handler/             # HTTP handlers
│   │   ├── middleware/          # JWT auth, CORS
│   │   ├── model/               # Domain types
│   │   ├── repository/          # SQL queries
│   │   └── service/             # Business logic + SSE hub
│   ├── migrations/              # SQL migration files
│   └── tests/                   # Go tests
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # React components
│   ├── lib/                     # Types, API client, hooks
│   └── __tests__/               # Jest tests
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```
