# Flow Reports

**Processing and Reconciliation Management Information System** — analytics dashboards, natural language queries, and role-based access control.

## Tech stack

- **Backend:** Django 6 + Django REST Framework, PostgreSQL, JWT (Simple JWT), django-cors-headers  
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS  

## Prerequisites

- Python 3.10+ (with venv recommended)
- Node.js 18+
- PostgreSQL (for the Django database)

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create the PostgreSQL database and user (if not already done), then:

```bash
# Configure DB in backend/flow_reports_project/settings.py if needed (NAME, USER, PASSWORD, HOST)
python manage.py migrate
python manage.py createsuperuser
```

Assign the **Administrator** role to your user (Django admin: **Users** → your user → **User profile** → set **Role** to **Administrator**), then run the server:

```bash
python manage.py runserver
```

API: **http://localhost:8000**

### 2. Frontend

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000 if needed
npm run dev
```

App: **http://localhost:3000**

### 3. Environment

| Where        | Variable              | Example                |
|-------------|------------------------|------------------------|
| **Frontend** | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| **Backend**  | DB in `settings.py`   | `NAME`, `USER`, `PASSWORD`, `HOST` |

Frontend `.env.local` (create if missing):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project structure

```
Flow_Reports/
├── backend/
│   ├── flow_reports_project/   # Django project (settings, urls)
│   ├── users/                 # Auth, RBAC (Role, UserProfile, JWT, /me, /roles, /users)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/               # Routes: login, register, dashboard, dashboard/users
│       ├── components/       # AuthGuard, etc.
│       ├── contexts/         # AuthContext (login, permissions)
│       ├── lib/              # api.ts (apiUrl, authFetch)
│       └── types/
└── README.md
```

## Features (Phase 1)

- **JWT authentication** — access + refresh tokens; login/register and protected routes
- **Role-based access control** — roles: Administrator, Editor, Viewer with permission codes
- **RBAC API** — `GET /api/users/me/`, `GET /api/users/roles/`, `GET /api/users/users/` (admin), `PATCH /api/users/users/<id>/role/` (admin)
- **Dashboard** — sidebar layout, role-based nav (e.g. **Users** for admins), user management page to assign roles

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | `/api/users/token/` | — | JWT obtain (username, password) |
| POST   | `/api/users/token/refresh/` | — | JWT refresh |
| GET    | `/api/users/me/` | JWT | Current user + role + permissions |
| GET    | `/api/users/roles/` | JWT | List roles |
| GET    | `/api/users/users/` | Admin | List users |
| PATCH  | `/api/users/users/<id>/role/` | Admin | Set user role |
| POST   | `/api/users/register/` | — | Register (username, email, password) |
| POST   | `/api/users/login/` | — | Legacy token login |

## Scripts

| Location  | Command | Description |
|-----------|----------|-------------|
| Backend  | `python manage.py runserver` | Dev server (port 8000) |
| Backend  | `python manage.py migrate` | Apply migrations |
| Frontend | `npm run dev` | Next.js dev (port 3000) |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run start` | Run production build |

## License

Proprietary — MAG Services.
