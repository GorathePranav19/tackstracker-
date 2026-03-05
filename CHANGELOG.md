# 🔄 Changelog
## TacksTracker - Team Goal & Task Tracker

All notable changes to TacksTracker are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v1.6.0
- Fix [KI-001] Progress & Status not saving on CREATE
- Fix [KI-002] Add loading states to all manager components
- Fix [KI-003] Notification bell initial load fix
- Fix [KI-004] Add client-side form validation
- Fix [KI-005] Add delete confirmation dialogs
- Fix [KI-006] Hide AI button when API key not configured
- Fix [KI-008] Auto-populate week number in task form

### Planned for v2.0.0
- Real-time updates (WebSockets)
- Task comments and @mentions
- File attachments
- Calendar view
- Kanban board view
- Fix [KI-007] Autocomplete on "Depends On" field
- Export to PDF/Excel
- Email notifications

---

## [1.5.0] - March 2026

### Summary
AI features temporarily removed for stability. Documentation and security hardening completed.

### Added
- `KNOWN_ISSUES.md` — comprehensive bug tracker with severity levels
- `CHANGELOG.md` — this file, tracking all version changes
- `DEMO_CREDENTIALS.md` — demo accounts and presentation guide
- `PRD.md` — full Product Requirements Document
- `MVP.md` — MVP definition and development phase documentation
- `SYSTEM_DESIGN.md` — complete system architecture documentation
- `QUICK_START.md` — quick reference for developers
- `WEEK1_SECURITY_IMPROVEMENTS.md` — security hardening documentation
- Added database performance indexes (`database-indexes.sql`)
- Seed script (`seed.js`) for populating demo data

### Changed
- `README.md` updated with complete setup, deployment, and troubleshooting guides
- Backend middleware stack hardened (Helmet, CORS, rate limiting)
- Input validation tightened across all Joi schemas

### Removed
- AI endpoint routes temporarily disabled (Groq integration pending API key configuration)
- `AIChatWidget` hidden from UI (AI button no longer clickable)

### Fixed
- CORS configuration corrected for production Vercel URLs
- JWT secret validation enforced at startup
- Database connection pooling configured with min/max limits

### Security
- Rate limiting applied to all auth endpoints (5/15min)
- Helmet security headers enabled (15+)
- SQL injection prevention verified via parameterized queries audit
- XSS protection enabled via Helmet and input sanitization

---

## [1.0.0] - February 2026

### Summary
Production MVP launch. Full CRUD operations, time tracking, notifications, and dashboard analytics.

### Added
- **User Authentication**
  - Registration with name, email, password
  - Login with JWT (7-day expiry)
  - bcrypt password hashing (10 rounds)
  - Auth rate limiting (5 attempts/15min)

- **Quarterly Goals**
  - Create, read, update, delete goals
  - Quarter (1-4) and year assignment
  - Progress tracking (0-100%) and status management
  - Filter by quarter, year, status

- **Monthly Plans**
  - Full CRUD operations
  - Optional link to quarterly goals
  - Month (1-12) and year assignment
  - Filter by parent goal

- **Weekly Tasks**
  - Full CRUD operations
  - Priority levels: low, medium, high
  - Due dates and urgency flag (`is_urgent`)
  - Task dependencies (`depends_on`)
  - Optional link to monthly plans
  - Estimated vs actual hours tracking
  - Filter by status and plan

- **Time Logging**
  - Log hours per task per day
  - Optional notes on time entries
  - Automatic rollup to `task.actual_hours`
  - Time log history per task

- **Notifications System**
  - Automated overdue task check (cron daily 9 AM)
  - Automated due-tomorrow reminder (cron daily 6 PM)
  - Notification center with last 50 entries
  - Unread count badge
  - Mark as read (single + all)

- **Dashboard & Analytics**
  - Personal stats: total goals, plans, tasks, hours, overdue count
  - Task status pie chart (Recharts)
  - Team performance bar chart
  - 5-tab navigation: Overview, Goals, Plans, Tasks, Team

- **Security**
  - JWT authentication on all protected routes
  - Helmet security headers
  - CORS configuration
  - Input validation (Joi)

- **Error Handling**
  - React Error Boundary wrapping app
  - Toast notifications (React Hot Toast)
  - Centralized Express error handler
  - Sentry integration (frontend + backend)

- **Infrastructure**
  - Vercel deployment configuration
  - Neon PostgreSQL database
  - Health check endpoint (`/health`)
  - Request logging middleware

### Dependencies Added
```json
// Backend
"express": "^4.18.2", "pg": "^8.11.3", "jsonwebtoken": "^9.0.2",
"bcryptjs": "^2.4.3", "joi": "^17.11.0", "helmet": "^7.1.0",
"cors": "^2.8.5", "express-rate-limit": "^7.1.5",
"node-cron": "^3.0.3", "@sentry/node": "^7.93.0"

// Frontend
"react": "^18.2.0", "react-router-dom": "^6.21.3",
"axios": "^1.6.7", "recharts": "^2.10.3",
"react-hot-toast": "^2.4.1", "lucide-react": "^0.312.0"
```

---

## [0.9.0] - February 2026 (Beta)

### Summary
Initial beta release for internal testing. Core CRUD operations functional, no production hardening.

### Added
- Basic Express server with PostgreSQL connection
- Database schema: `users`, `quarterly_goals`, `monthly_plans`, `weekly_tasks`, `time_logs`, `notifications`
- Basic CRUD routes for all entities
- Simple React frontend with login/register
- GoalManager, PlanManager, TaskManager components
- Basic dashboard with stat cards
- JWT authentication (initial implementation)

### Known Beta Issues (all resolved in v1.0.0)
- No rate limiting on any endpoints
- No input validation
- CORS allowed all origins (`*`)
- No error boundary in frontend
- Passwords stored with bcrypt 5 rounds (increased to 10 in v1.0.0)
- No Helmet security headers

---

## Migration Guide

### v1.0.0 → v1.5.0

**Database:** No schema changes. Indexes added for performance.

```sql
-- Run these in your Neon SQL editor to apply performance indexes:
-- (see database-indexes.sql for full content)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_goals_user_year_quarter ON quarterly_goals(user_id, year, quarter);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON weekly_tasks(user_id, status);
```

**Environment Variables:** No new required variables. `GROQ_API_KEY` now optional (AI disabled if absent).

**Frontend:** No breaking changes. AI widget hidden automatically if backend reports AI unavailable.

---

### v0.9.0 → v1.0.0

**Breaking Changes:**
- Rate limiting added — auth endpoints now limited to 5 requests/15 minutes
- CORS updated — only whitelisted origins allowed in production
- JWT payload structure changed: `{ id, email, role }` (previously `{ userId, email }`)

**Action Required:**
1. Clear existing JWTs: users must log in again
2. Update `FRONTEND_URL` environment variable in backend `.env`
3. Apply Helmet middleware if self-hosting

---

## Links

- [Known Issues](./KNOWN_ISSUES.md)
- [Demo Credentials](./DEMO_CREDENTIALS.md)
- [System Design](./SYSTEM_DESIGN.md)
- [GitHub Repository](https://github.com/GorathePranav19/tackstracker-)

---

**Maintainer:** TacksTracker Engineering Team  
**Format:** [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
