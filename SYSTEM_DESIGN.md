# System Design Document
## TacksTracker - Team Goal & Task Tracker

**Version:** 2.0.0  
**Last Updated:** March 2026  
**Document Owner:** Engineering Team  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [Database Design](#database-design)
5. [API Structure](#api-structure)
6. [Frontend Architecture](#frontend-architecture)
7. [Backend Architecture](#backend-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Security Considerations](#security-considerations)
10. [Scalability Considerations](#scalability-considerations)
11. [Monitoring & Observability](#monitoring--observability)

---

## 🏗️ High-Level Architecture

### System Overview

TacksTracker follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│                    (React Frontend)                         │
│  - React 18, React Router, Axios, Recharts, AuthContext    │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│                  (Node.js + Express API)                    │
│  Middleware: Sentry, Helmet, CORS, Rate Limiting,           │
│             JWT Auth, Joi Validation, Request Logging       │
│  Endpoints: /api/auth, /api/quarterly-goals,                │
│             /api/monthly-plans, /api/weekly-tasks,          │
│             /api/time-logs, /api/notifications,             │
│             /api/dashboard, /api/ai                         │
│  Services: node-cron, Groq AI, Smart Features               │
└─────────────────────────────────────────────────────────────┘
                            ↓ PostgreSQL Protocol
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│                   (PostgreSQL Database)                     │
│  Tables: users, quarterly_goals, monthly_plans,             │
│          weekly_tasks, time_logs, notifications             │
│  Indexes: User queries, date ranges, status filtering       │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Stateless Backend** - JWT tokens for auth, no server-side sessions
2. **Separation of Concerns** - Frontend, backend, database clearly separated
3. **RESTful API** - Standard HTTP methods (GET, POST, PUT, DELETE)
4. **Database Normalization** - Third normal form (3NF) with foreign keys
5. **Security by Default** - All routes protected, input validated, queries parameterized
6. **Horizontal Scalability** - Stateless design allows multiple server instances
7. **Error Resilience** - Graceful degradation with error boundaries and logging

---

## 🧩 System Components

### 1. Frontend (React SPA)

**Technology:** React 18, React Router 6, Axios, Recharts, Lucide React

**Structure:**
```
src/
├── components/       # Reusable UI components
├── context/          # Global state (AuthContext)
├── services/         # API client abstractions
├── styles.css        # Global styles
├── App.js            # Root component with routing
└── index.js          # React entry point
```

**Responsibilities:** Render UI, handle interactions, make API calls, manage local state, store JWT in localStorage, display charts, handle routing, show toast notifications.

---

### 2. Backend (Node.js + Express)

**Technology:** Node.js 16+, Express 4, JWT, bcryptjs, Joi, Helmet, node-cron

**Structure:**
```
backend/
├── server.js              # Express app entry point
├── database.js            # PostgreSQL connection
├── middleware/            # auth.js, validation.js, aiRateLimit.js
├── routes/                # ai.routes.js
└── services/ai/           # groqService.js, smartFeatures.js
```

**Responsibilities:** Handle HTTP requests, authenticate users, validate input, execute DB queries, apply security headers, rate limit requests, run scheduled tasks, integrate AI, log requests, return JSON responses.

---

### 3. Database (PostgreSQL via Neon)

**Tables:** `users`, `quarterly_goals`, `monthly_plans`, `weekly_tasks`, `time_logs`, `notifications`

**Indexes:** User lookups, goal/plan/task queries, due date searches, status filtering, notification queries

---

### 4. AI Services (Groq)

**Features:** Natural language queries, task generation from notes, weekly insights, risk detection, completion predictions, smart task assignment

---

### 5. Background Jobs (Cron)

- **Daily 9 AM** - Overdue task check → create overdue notifications
- **Daily 6 PM** - Due tomorrow check → create reminder notifications

---

### 6. Monitoring (Sentry)

Tracks runtime errors, unhandled exceptions, API failures, DB errors, performance metrics, and user context on both frontend and backend.

---

## 🔄 Data Flow

### User Registration Flow
```
User → POST /api/auth/register → Check email uniqueness → Hash password (bcrypt 10 rounds) → INSERT users → Return { userId }
```

### User Login Flow
```
User → POST /api/auth/login → SELECT user by email → bcrypt.compare() → jwt.sign() (7d expiry) → Return { token, user }
```

### Create Weekly Task Flow
```
User → POST /api/weekly-tasks (Bearer token) → jwt.verify() → Joi.validate() → INSERT weekly_tasks → Return { id }
```

### Dashboard Stats Flow
```
User → GET /api/dashboard/stats → Verify JWT → Parallel COUNT queries (indexed <50ms) → Return aggregate stats object
```

### AI Natural Language Query Flow
```
User → POST /api/ai/query → Send query to Groq → Groq returns tool call → Execute DB query → Send results back to Groq → Return { answer, data }
```

### Automated Notification Flow
```
Cron 9AM → Find overdue tasks (due_date < today AND status != completed) → INSERT notifications → User sees badge on next login
```

---

## 💾 Database Design

### Table Specifications

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
```

#### quarterly_goals
```sql
CREATE TABLE quarterly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quarter INTEGER NOT NULL CHECK(quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_goals_user_year_quarter ON quarterly_goals(user_id, year, quarter);
```

#### monthly_plans
```sql
CREATE TABLE monthly_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  quarterly_goal_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quarterly_goal_id) REFERENCES quarterly_goals(id) ON DELETE SET NULL
);
CREATE INDEX idx_plans_user_year_month ON monthly_plans(user_id, year, month);
```

#### weekly_tasks
```sql
CREATE TABLE weekly_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  monthly_plan_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 53),
  year INTEGER NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  estimated_hours REAL DEFAULT 0,
  actual_hours REAL DEFAULT 0,
  due_date DATE,
  is_urgent BOOLEAN DEFAULT false,
  depends_on INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (monthly_plan_id) REFERENCES monthly_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (depends_on) REFERENCES weekly_tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_tasks_user_status ON weekly_tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON weekly_tasks(due_date) WHERE status != 'completed';
```

#### time_logs
```sql
CREATE TABLE time_logs (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  hours REAL NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_time_logs_user_task ON time_logs(user_id, task_id, date);
```

#### notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('reminder', 'overdue', 'dependency', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
```

### Performance Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| users | idx_users_email | Login lookups |
| quarterly_goals | idx_goals_user_year_quarter | Goal queries |
| monthly_plans | idx_plans_user_year_month | Plan queries |
| weekly_tasks | idx_tasks_user_status | Task filtering |
| weekly_tasks | idx_tasks_due_date | Overdue detection (partial) |
| notifications | idx_notifications_user_unread | Notification queries |
| time_logs | idx_time_logs_user_task | Time log queries |

**Impact:** Before indexes: 500-1000ms; After indexes: 5-20ms — **100x speedup**

---

## 🔌 API Structure

### Authentication

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/register` | POST | Register new user | 5/15min |
| `/api/auth/login` | POST | Login + get JWT | 5/15min |

### Resources (all require `Authorization: Bearer <token>`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quarterly-goals` | GET | List user's goals |
| `/api/quarterly-goals` | POST | Create goal |
| `/api/quarterly-goals/:id` | PUT | Update goal |
| `/api/quarterly-goals/:id` | DELETE | Delete goal |
| `/api/monthly-plans` | GET/POST/PUT/DELETE | Plan CRUD |
| `/api/weekly-tasks` | GET/POST/PUT/DELETE | Task CRUD |
| `/api/time-logs` | GET/POST | Log time |
| `/api/notifications` | GET | List notifications |
| `/api/notifications/:id/read` | PUT | Mark as read |
| `/api/dashboard/stats` | GET | Personal stats |
| `/api/dashboard/team` | GET | Team performance |

### AI Endpoints

| Endpoint | Method | Rate Limit |
|----------|--------|------------|
| `/api/ai/query` | POST | 20/hour |
| `/api/ai/generate-tasks` | POST | 5/hour |
| `/api/ai/insights` | POST | 20/hour |
| `/api/ai/risks` | GET | 20/hour |
| `/api/ai/predictions/:id` | GET | 20/hour |

### Error Responses

```json
{ "error": "Error message", "details": ["validation error 1"] }
```

**HTTP Status Codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App → Router
  ├── /login → Login
  ├── /register → Register
  └── /* (protected) → Layout
      ├── Header + NotificationBell
      └── Dashboard
          ├── Overview (StatsCards + PieChart + BarChart)
          ├── Goals Tab (GoalManager)
          ├── Plans Tab (PlanManager)
          ├── Tasks Tab (TaskManager + TimeLogModal)
          └── Team Tab (TeamPerformanceChart)
ErrorBoundary (wraps all)
```

### State Management

**Global (AuthContext):** `{ user, token, loading, login, logout, register }`

**Local (Component-level):** useState hooks for lists, forms, filters, loading states

### API Service Pattern

```javascript
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

// Request interceptor - auto-attach JWT
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
API.interceptors.response.use(
  res => res,
  err => { if (err.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; } return Promise.reject(err); }
);
```

---

## ⚙️ Backend Architecture

### Express Middleware Stack (in order)

1. Sentry request handler
2. Helmet (security headers)
3. Custom headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
4. CORS
5. Body parser (express.json)
6. Request logging
7. Rate limiting (per route)
8. Routes with JWT authentication middleware
9. Centralized error handler
10. Sentry error handler

### Authentication Middleware

```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user; // { id, email, role }
    next();
  });
};
```

### Data Isolation Pattern

Every query MUST filter by `req.user.id` to prevent cross-user data access:

```javascript
// ✅ CORRECT
const goals = await getAll('SELECT * FROM quarterly_goals WHERE user_id = ?', [req.user.id]);
// ❌ INCORRECT - exposes all users' data
const goals = await getAll('SELECT * FROM quarterly_goals');
```

### Database Query Helpers

```javascript
async function runQuery(sql, params) { /* INSERT/UPDATE/DELETE, returns { id, changes } */ }
async function getOne(sql, params) { /* Returns single row */ }
async function getAll(sql, params) { /* Returns array of rows */ }
// All use ? → $1, $2... placeholder conversion for PostgreSQL
```

---

## 🚀 Deployment Architecture

```
GitHub Push → Vercel Webhook → Build → Deploy to Preview → Smoke Tests → Deploy to Production
```

### Vercel Projects

- **Frontend**: React static build, served via CDN
- **Backend**: Node.js serverless function (`server.js`)
- **Database**: Neon serverless PostgreSQL

### Environment Variables

**Backend:** `JWT_SECRET`, `POSTGRES_URL`, `SENTRY_DSN` (opt), `GROQ_API_KEY` (opt), `FRONTEND_URL`, `NODE_ENV`

**Frontend:** `REACT_APP_API_URL`, `REACT_APP_SENTRY_DSN` (opt)

### Health Check

```javascript
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected', version: '2.0.0' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

---

## 🔒 Security Considerations

### 1. JWT Authentication
- 7-day expiry, 32+ char secret, minimal payload (id, email, role)

### 2. Password Security
- bcrypt with 10 salt rounds, minimum 8 characters enforced by Joi

### 3. Input Validation
- Three layers: React client-side → Joi middleware → PostgreSQL CHECK constraints

### 4. SQL Injection Prevention
- All queries use parameterized placeholders (`?` → `$1, $2...`)

### 5. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 5 | 15 min |
| General API | 100 | 15 min |
| AI standard | 20 | 1 hour |
| AI expensive | 5 | 1 hour |

### 6. CORS
- Production: whitelisted domains only
- Development: localhost allowed

### 7. Helmet (15+ security headers)
- Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, and more

---

## 📈 Scalability Considerations

### 1. Horizontal Scaling
Stateless JWT design allows multiple backend instances behind a load balancer with no shared session state.

### 2. Database Connection Pooling
```javascript
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, min: 10, max: 20 });
```

### 3. Future Caching (Redis)
```javascript
// Cache dashboard stats with 5-minute TTL
const cacheKey = `dashboard:stats:${userId}`;
let stats = await redis.get(cacheKey);
if (!stats) { stats = await calculateStats(userId); await redis.setex(cacheKey, 300, JSON.stringify(stats)); }
```

### 4. Future Pagination
Currently returns all records. Future: 50 items per page with `LIMIT`/`OFFSET`.

### 5. Future Read Replicas
Route reads to replicas, writes to primary for high-scale scenarios.

### 6. Future Queue System
Use Bull/Redis to process cron notifications asynchronously for high volume.

---

## 📊 Monitoring & Observability

### 1. Error Tracking (Sentry)
- Backend: `@sentry/node` — auto-captures all unhandled errors
- Frontend: `@sentry/react` — captures React errors + session replays
- Configured with `beforeSend` to strip sensitive auth headers

### 2. Request Logging
```
[2026-03-05T10:30:45.123Z] POST /api/weekly-tasks
[2026-03-05T10:30:45.234Z] POST /api/weekly-tasks - 201
```

### 3. Key Metrics to Monitor
- API response time (p50, p95, p99)
- Database query time
- Error rate per endpoint
- Request rate (req/sec)
- Active DB connections
- Memory and CPU usage

### 4. Alerting Rules
- **Critical**: Error rate >1% for 5min, DB connection failures, p95 >2s
- **Warning**: Error rate >0.5% for 10min, p95 >1s, disk >80%

---

## 📝 Appendix

### Technology Versions

| Component | Version |
|-----------|---------|
| Node.js | 16+ |
| React | 18.2.0 |
| PostgreSQL | 12+ |
| Express | 4.18.2 |
| jsonwebtoken | 9.0.2 |

---

**Document Status:** Complete  
**Last Review:** March 2026  
**Next Review:** June 2026  
**Maintainers:** Engineering Team
