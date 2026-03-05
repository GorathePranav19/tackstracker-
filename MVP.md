# Minimum Viable Product (MVP)
## TacksTracker - Team Goal & Task Tracker

**Version:** 1.0.0  
**Target Launch:** Q1 2026  
**Status:** ✅ Completed  
**Document Owner:** Product Team

---

## 📋 Table of Contents

1. [MVP Definition](#mvp-definition)
2. [Core Features for MVP](#core-features-for-mvp)
3. [Excluded from MVP](#excluded-from-mvp)
4. [Development Phases](#development-phases)
5. [Launch Checklist](#launch-checklist)
6. [Post-MVP Roadmap](#post-mvp-roadmap)

---

## 🎯 MVP Definition

### What is the Minimum Viable Product?

The TacksTracker MVP is the **simplest version** of the product that delivers core value to users: a hierarchical goal management system that helps teams track quarterly goals, monthly plans, and weekly tasks with basic time tracking and analytics.

### MVP Goal Statement

> Enable individual users and small teams to break down quarterly goals into actionable weekly tasks, track time spent, and visualize progress through a simple dashboard - all in one secure web application.

### Success Criteria

- ✅ Users can complete the full workflow (goal → plan → task → time log) in <5 minutes
- ✅ 60% of registered users create at least one goal within first session
- ✅ 40% of users return within 7 days (Week 1 retention)
- ✅ Average session duration >5 minutes
- ✅ <0.5% error rate
- ✅ System uptime >99%

### Target Users for MVP

**Primary:** Individual contributors and small team leads (5-10 people) who need to organize goals, track time, visualize progress, and reduce tool sprawl.

**Out of Scope for MVP:** Enterprise teams, consultancies with complex billing, remote teams needing advanced collaboration.

---

## ✅ Core Features for MVP

### 1. ✅ User Authentication (Implemented)

- User registration with name, email, password
- Secure login with JWT tokens (7-day expiry)
- Password hashing with bcrypt (10 rounds)
- Basic rate limiting (5 login attempts per 15 minutes)
- Role field (admin, member) for future expansion

**Acceptance Criteria:**
- [x] User can register with unique email
- [x] User can login and receive JWT token
- [x] Token expires after 7 days
- [x] Invalid credentials return error
- [x] Rate limiting prevents brute force

---

### 2. ✅ Quarterly Goals Management (Implemented)

- Create goal with title, description, quarter, year
- Update goal progress (0-100%) and status
- Delete goal (does not cascade-delete linked plans)
- List all user's goals ordered by date
- Status options: pending, in_progress, completed, cancelled

**Acceptance Criteria:**
- [x] User can create goal for specific quarter/year
- [x] User can update progress percentage and status
- [x] Goals display in chronological order
- [x] Deleting goal doesn't delete linked plans

---

### 3. ✅ Monthly Plans Management (Implemented)

- Create plan with title, description, month, year
- Optionally link plan to quarterly goal
- Update plan progress and status
- Delete plan (does not cascade-delete tasks)
- List plans with filtering by goal

**Acceptance Criteria:**
- [x] User can create standalone or linked plan
- [x] User can link/unlink from goals
- [x] User can filter plans by parent goal
- [x] Plans ordered by date

---

### 4. ✅ Weekly Tasks Management (Implemented)

- Create task with title, description, week, year
- Set priority (low, medium, high), due date, estimated hours, urgency
- Optionally link to monthly plan
- Add task dependencies (depends_on task_id)
- Update status, track actual hours (auto-updated from time logs)
- Delete task, list with filters (status, plan, priority)

**Acceptance Criteria:**
- [x] User can create standalone or linked task
- [x] User can set priority, due date, and dependencies
- [x] Tasks show actual vs estimated hours
- [x] Filter and sort by status/due date work correctly

---

### 5. ✅ Time Tracking (Implemented)

- Log hours per task per day with optional notes
- Automatic rollup: task.actual_hours updates when log created
- Total hours displayed on dashboard

**Acceptance Criteria:**
- [x] User can log hours on any task
- [x] Hours automatically add to task.actual_hours
- [x] Dashboard shows total hours logged

---

### 6. ✅ Dashboard & Analytics (Implemented)

- **Personal Stats:** Total goals, plans, tasks; completed/pending/in-progress counts; total hours logged; overdue count
- **Visual Charts:** Pie chart (task status distribution), Bar chart (team performance)
- **Tab Navigation:** Overview, Goals, Plans, Tasks, Team Performance

**Acceptance Criteria:**
- [x] Dashboard loads in <2 seconds
- [x] Charts are interactive and responsive
- [x] Tab navigation works smoothly

---

### 7. ✅ Notifications System (Implemented)

- **Automated:** Overdue tasks (daily 9 AM), tasks due tomorrow (daily 6 PM)
- **Types:** Reminder, Overdue, General
- **Center:** Last 50 notifications, unread count badge, mark as read (single or all)

**Acceptance Criteria:**
- [x] Cron jobs run at scheduled times
- [x] Notification bell shows unread count
- [x] Can mark individual or all as read

---

### 8. ✅ Security Basics (Implemented)

- JWT on all protected routes, bcrypt password hashing (10 rounds)
- Rate limiting (100/15min API, 5/15min auth)
- Helmet headers (15+), CORS whitelisting
- Joi input validation, parameterized SQL queries, XSS protection

**Acceptance Criteria:**
- [x] All API routes require valid JWT
- [x] Passwords never stored in plaintext
- [x] Rate limiting blocks excessive requests
- [x] SQL queries use parameters

---

### 9. ✅ Performance Optimization (Implemented)

- Database indexes on frequently queried columns
- PostgreSQL connection pooling
- Efficient queries (no N+1 problems)
- Frontend code splitting by route, error boundaries

**Acceptance Criteria:**
- [x] API response time <200ms (p95)
- [x] Dashboard loads in <2 seconds
- [x] Database indexes applied

---

### 10. ❌ AI Features (NOT in MVP - Added in v2.0)

**Current Status:** ✅ Implemented in v2.0 — natural language queries, task generation, weekly insights, risk detection, predictions, smart assignment.

---

## ❌ Excluded from MVP

### Collaboration Features
Real-time updates (WebSockets), task comments, @mentions, file attachments, activity feed, team chat. **Post-MVP Priority:** Phase 3 (Month 4-6)

### Advanced Task Management
Recurring tasks, templates, subtasks, labels, custom fields, bulk operations, kanban, calendar, Gantt charts. **Post-MVP Priority:** Phase 4 (Month 7-9)

### Advanced Analytics
Burndown charts, velocity tracking, custom reports, PDF/Excel export, comparative analytics, heatmaps. **Post-MVP Priority:** Phase 4 (Month 7-9)

### Integrations
Calendar sync, email integration, Slack/Discord, Jira/Trello, Zapier, public API, webhooks. **Post-MVP Priority:** Phase 5 (Month 10-12)

### Mobile App
React Native iOS/Android, offline mode, push notifications. **Post-MVP Priority:** Phase 6 (Month 13-18)

### Enterprise Features
SSO (SAML/OAuth), advanced permissions, audit logs, custom workflows, white-label, on-premise. **Post-MVP Priority:** Phase 7 (Month 19-24)

---

## 🏗️ Development Phases

### Phase 0: Setup & Infrastructure ✅
Git repo, Vercel, Neon DB, environment variables, Sentry, documentation.

### Phase 1: Backend Foundation ✅
Express server, DB schema (6 tables), auth (JWT), security middleware, Joi validation, cron jobs, DB indexes.

### Phase 2: CRUD Operations ✅
Full CRUD for quarterly goals, monthly plans, weekly tasks, time logs, notifications, dashboard stats, team performance.

### Phase 3: Frontend Foundation ✅
React app, React Router, AuthContext, login/register, protected routes, layout, toast notifications, error boundary, Axios client.

### Phase 4: Feature Components ✅
GoalManager, PlanManager, TaskManager, TimeLogModal — with forms, filters, and confirmations.

### Phase 5: Dashboard & Analytics ✅
Dashboard layout with 5 tabs, 4 stat cards, Recharts pie chart and bar chart, responsive design, loading states.

### Phase 6: Notifications ✅
Notification bell, list modal, mark-as-read, unread badge, cron overdue check (9 AM), cron reminder (6 PM).

### Phase 7: Polish & Testing ✅
Bug fixes, responsive improvements, loading states, empty states, error messages, cross-browser/mobile testing.

### Phase 8: Launch Preparation ✅
Production setup, env vars, DB indexes, Sentry, complete documentation, demo data, launch checklist.

---

## ✅ Launch Checklist

### Pre-Launch
- [x] Backend & frontend deployed to Vercel
- [x] Database indexes applied in Neon
- [x] JWT_SECRET is strong (32+ characters)
- [x] Rate limiting, Helmet headers, Joi validation, CORS configured
- [x] Sentry DSN configured and tested
- [x] Health check endpoint working
- [x] All CRUD operations verified
- [x] API response time <200ms (p95)
- [x] README.md, PRD.md, MVP.md, SYSTEM_DESIGN.md complete
- [x] Cross-browser and mobile testing done

### Launch Day
- [ ] Final smoke test on production
- [ ] Announce on social media / ProductHunt
- [ ] Monitor Sentry for errors
- [ ] Watch health check endpoint

### Post-Launch (Week 1)
- [ ] Daily error log and metrics review
- [ ] Fix high-priority bugs (P1)
- [ ] Collect user feedback
- [ ] Track: DAU, registrations, goals/tasks created, error rate, session duration

---

## 🚀 Post-MVP Roadmap

| Month | Phase | Focus |
|-------|-------|-------|
| Month 2 | Stability | Bug fixes, performance, mobile UX, task search |
| Month 3 | AI ✅ | Natural language queries, task generation, insights, risk detection |
| Month 4-6 | Collaboration | Real-time, comments, file attachments, @mentions |
| Month 7-9 | Advanced Features | Recurring tasks, kanban, calendar, burndown charts |
| Month 10-12 | Integrations | Calendar sync, Slack, Jira/Trello, public API |
| Month 13-18 | Mobile & Enterprise | React Native, SSO, audit logs, custom workflows |

---

## 📊 MVP Success Evaluation

| After | Evaluate | Decision |
|-------|----------|----------|
| 1 Week | >80% registration completion, <0.5% errors, 0 critical bugs | ✅ Proceed / ⚠️ Fix bugs / ❌ Pivot |
| 1 Month | MAU >1000, DAU/MAU >30%, NPS >40 | ✅ Invest in AI / ⚠️ Improve retention |
| 3 Months | MAU >10K, Month 3 retention >30%, NPS >50 | ✅ Scale team / ⚠️ Optimize / ❌ Reassess PMF |

---

## 📝 Appendix

### MVP Principles
1. **Solve One Problem Well** — Hierarchical goal tracking, not all-in-one suite
2. **Speed Over Perfection** — Launch in 8 weeks, iterate on feedback
3. **Manual Before Automated** — AI added post-launch
4. **Web Before Mobile** — Responsive web first, native apps later
5. **Simple Before Complex** — Reduce cognitive load for new users

### Risk Mitigation
- **Users don't understand hierarchy** → Onboarding tutorial, demo data, tooltips
- **Competitor launches first** → Fast 8-week MVP, unique AI in v2.0, better UX
- **Low retention** → Notification system, weekly insights, fast iteration
- **Technical debt** → Modular architecture, refactoring sprints quarterly

---

**Document Status:** ✅ Complete  
**Next Review:** Post-Launch (Week 2)  
**Stakeholders:** Product, Engineering, Design
