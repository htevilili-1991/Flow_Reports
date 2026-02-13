# Flow Reports

**Processing and Reconciliation Management Information System** — analytics dashboards, natural language queries, and role-based access control.

## Tech stack

- **Backend:** Django 6 + Django REST Framework, PostgreSQL, JWT (Simple JWT), django-cors-headers  
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, react-grid-layout, Recharts  

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

Create the PostgreSQL database and user, then run migrations:

```bash
# Create DB and user (run as postgres superuser; password in backend/.env)
sudo -u postgres psql -f backend/scripts/create_db.sql

# Or from backend/scripts: sudo -u postgres psql -f create_db.sql
```

Copy and edit env (optional; defaults match create_db.sql):

```bash
cd backend
cp .env.example .env
# Edit .env if you used different DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
```

Then:

```bash
pip install -r requirements.txt
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
| **Backend**  | `backend/.env`       | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`; optional `REDIS_URL`, `QUERY_CACHE_TIMEOUT` (see `.env.example`) |

Frontend `.env.local` (create if missing):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project structure

```
Flow_Reports/
├── backend/
│   ├── flow_reports_project/   # Django project (settings, urls, cache config)
│   ├── users/                  # Auth, RBAC (Role, UserProfile, JWT, /me, /roles, /users)
│   ├── questions/              # Saved questions, NL→SQL, run read-only query
│   ├── data_sources/           # Connections (PostgreSQL, MySQL, SQLite), schema, run-query, query_cache
│   ├── dashboards/             # Dashboard model, layout/widgets API, one data source per dashboard
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                # Routes: login, register, dashboard, dashboards, questions, data-sources, users
│       ├── components/          # AuthGuard, dashboard (FilterBar, viz modals, VisualizationBuilder)
│       ├── contexts/            # AuthContext (login, permissions)
│       ├── lib/                 # api.ts (apiUrl, authFetch)
│       └── types/
└── README.md
```

## Features

### Phase 1
- **JWT authentication** — access + refresh tokens; login/register and protected routes
- **Role-based access control** — roles: Administrator, Editor, Viewer with permission codes
- **RBAC API** — `GET /api/users/me/`, `GET /api/users/roles/`, `GET /api/users/users/` (admin), `PATCH /api/users/users/<id>/role/` (admin)
- **Dashboard** — sidebar layout, role-based nav (Users, Questions), user management page

### Phase 2 – Data & queries
- **Saved questions** — store title, natural language question, and generated SQL per user
- **NL→SQL** — natural language to read-only SQL (placeholder rules; extend or plug in LLM)
- **Run query API** — execute SELECT-only SQL, return rows as JSON
- **Questions UI** — list, create, edit, run; results table and chart placeholder
- **Data sources** — add PostgreSQL, MySQL, or SQLite connections; test connection before save; list and edit

### Dashboards & visualizations
- **Dashboards** — create dashboard with a chosen data source; drag-and-drop grid layout (react-grid-layout); save layout and widgets
- **Saved visualizations** — per data source: table or custom SQL, chart type (line, bar, area, pie, table), column mapping and chart options (title, axis labels, legend)
- **Viz builder** — drag variables into drop zones (X, Y, series, etc.); create viz from schema table or custom SQL
- **Widgets** — dashboard widgets load data via run-query (table or SQL); one data source per dashboard, add only visualizations from that source

### Cache & refresh (Power BI–style)
- **Query result cache** — run-query results are cached (in-memory by default; Redis if `REDIS_URL` is set). TTL: `QUERY_CACHE_TIMEOUT` (default 300s).
- **Refresh data** — dashboard "Refresh data" button calls `POST /api/data-sources/<id>/refresh-cache/` to invalidate cache for that source, then widgets refetch from the DB.
- **Optional** — use PostgreSQL materialized views for pre-aggregated data and refresh them on a schedule.

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
| GET    | `/api/questions/` | JWT | List saved questions |
| POST   | `/api/questions/` | JWT | Create saved question |
| GET    | `/api/questions/<id>/` | JWT | Get saved question |
| PATCH  | `/api/questions/<id>/` | JWT | Update saved question |
| DELETE | `/api/questions/<id>/` | JWT | Delete saved question |
| POST   | `/api/questions/generate-sql/` | JWT | NL→SQL (body: natural_language, optional question_id) |
| POST   | `/api/questions/run/` | JWT | Run query (body: question_id or sql) |
| GET    | `/api/data-sources/` | JWT | List data sources |
| POST   | `/api/data-sources/` | JWT | Create data source |
| GET    | `/api/data-sources/<id>/` | JWT | Get data source |
| PATCH  | `/api/data-sources/<id>/` | JWT | Update data source |
| DELETE | `/api/data-sources/<id>/` | JWT | Delete data source |
| POST   | `/api/data-sources/test/` | JWT | Test connection (body: db_type, config or data_source_id) |
| GET    | `/api/data-sources/<id>/schema/` | JWT | Tables and columns for this data source |
| POST   | `/api/data-sources/<id>/run-query/` | JWT | Run SQL or table query (body: sql or table_name; optional refresh: true to bypass cache) |
| POST   | `/api/data-sources/<id>/refresh-cache/` | JWT | Invalidate query cache for this source (optional body: table_name or sql to clear only that) |
| GET    | `/api/data-sources/<id>/visualizations/` | JWT | List saved visualizations for this data source |
| POST   | `/api/data-sources/<id>/visualizations/` | JWT | Create saved visualization |
| GET    | `/api/data-sources/<ds_pk>/visualizations/<viz_pk>/` | JWT | Get saved visualization |
| PATCH  | `/api/data-sources/<ds_pk>/visualizations/<viz_pk>/` | JWT | Update saved visualization |
| DELETE | `/api/data-sources/<ds_pk>/visualizations/<viz_pk>/` | JWT | Delete saved visualization |
| GET    | `/api/dashboards/` | JWT | List dashboards |
| POST   | `/api/dashboards/` | JWT | Create dashboard |
| GET    | `/api/dashboards/<id>/` | JWT | Get dashboard (layout, widgets) |
| PATCH  | `/api/dashboards/<id>/` | JWT | Update dashboard |
| DELETE | `/api/dashboards/<id>/` | JWT | Delete dashboard |
| PATCH  | `/api/dashboards/<id>/layout/` | JWT | Save layout and widgets (body: layout, widgets) |

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
