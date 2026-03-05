# 🔐 Demo Credentials & Presentation Guide
## TacksTracker - Team Goal & Task Tracker

**Version:** 1.5.0  
**Last Updated:** March 2026  
**Purpose:** Demo accounts, walkthrough scripts, and testing scenarios

> ⚠️ **Security Note:** These credentials are for demo/testing purposes only. Do not use these passwords for any real accounts. Change them immediately in a production environment.

---

## 📋 Table of Contents

1. [Demo Accounts](#demo-accounts)
2. [5-Minute Demo Script](#5-minute-demo-script)
3. [Testing Scenarios](#testing-scenarios)
4. [Mobile Demo Guide](#mobile-demo-guide)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Security Notes](#security-notes)

---

## 🔑 Demo Accounts

### Primary Demo Account

| Field | Value |
|-------|-------|
| **Email** | `demo@tackstracker.com` |
| **Password** | `Demo@1234` |
| **Role** | `member` |
| **Name** | Demo User |
| **Data** | Pre-loaded with sample goals, plans, tasks, and time logs |

**Pre-loaded Demo Data:**
- 3 Quarterly Goals (Q1 2026)
- 5 Monthly Plans linked to goals
- 12 Weekly Tasks (mix of statuses)
- 15 Time log entries across multiple tasks
- 5 Notifications (2 unread, 3 read)

---

### Team Member Accounts

| Name | Email | Password | Role |
|------|-------|----------|------|
| Alice Manager | `alice@tackstracker.com` | `Alice@1234` | `member` |
| Bob Developer | `bob@tackstracker.com` | `Bob@1234` | `member` |
| Carol Designer | `carol@tackstracker.com` | `Carol@1234` | `member` |
| Admin User | `admin@tackstracker.com` | `Admin@1234` | `admin` |

> 💡 Log in with multiple accounts to demonstrate the **Team Performance** dashboard, which aggregates stats across all users.

---

### Creating Fresh Demo Data

If demo data has been cleared or you need a fresh start:

```bash
# Via API (POST request)
POST https://<your-backend-url>/api/seed
# No authentication required for seed endpoint
# Creates all demo accounts + sample data

# Via CLI (local development)
cd backend
npm run seed
```

---

## 🎬 5-Minute Demo Script

A structured walkthrough for product demos and presentations.

---

### ⏱️ Minute 1: Authentication & Overview (0:00 – 1:00)

**Talking Points:**
> "TacksTracker connects your strategic goals to daily execution. Let me show you how it works."

1. Open the app and show the **Login** page
2. Enter `demo@tackstracker.com` / `Demo@1234` and log in
3. Point to the **Dashboard Overview** tab
   - "Here you can see all your key metrics at a glance"
   - Highlight the 4 stat cards: Goals, Tasks, Hours Logged, Overdue
4. Show the **Task Status Pie Chart**
   - "Instantly understand your workload breakdown"
5. Show the **Notification Bell** with unread badge
   - "Automated reminders keep you on top of deadlines"

---

### ⏱️ Minute 2: Creating a Quarterly Goal (1:00 – 2:00)

**Talking Points:**
> "Everything starts from strategic goals. Let's create one for this quarter."

1. Click the **Quarterly Goals** tab
2. Show existing goals with their progress bars and statuses
3. Click **Create New Goal**
4. Fill in:
   - Title: `"Launch Mobile App Beta"`
   - Quarter: `Q2`, Year: `2026`
   - Description: `"Build and release the React Native beta version"`
5. Click **Submit**
6. Show the new goal appearing in the list

**Key Points to Highlight:**
- Goals are scoped to a specific quarter for time-boxing
- Progress and status can be manually updated as work progresses

---

### ⏱️ Minute 3: Monthly Plans & Weekly Tasks (2:00 – 3:30)

**Talking Points:**
> "Now let's break that goal down into a monthly plan and actionable tasks."

1. Click the **Monthly Plans** tab
2. Click **Create New Plan**
3. Fill in:
   - Title: `"Backend API Development"`
   - Link to: `"Launch Mobile App Beta"` (the goal just created)
   - Month: `April`, Year: `2026`
4. Click **Submit**

5. Click the **Weekly Tasks** tab
6. Click **Create New Task**
7. Fill in:
   - Title: `"Design REST API endpoints"`
   - Plan: `"Backend API Development"`
   - Priority: `High`
   - Due Date: `April 7, 2026`
   - Estimated Hours: `12`
8. Click **Submit**
9. Show the task in the list with priority badge and due date

**Key Points to Highlight:**
- Three-tier hierarchy: Goal → Plan → Task
- Every task can be traced back to a strategic objective

---

### ⏱️ Minute 4: Time Tracking (3:30 – 4:15)

**Talking Points:**
> "When work happens, we log time directly on the task. This gives us estimated vs actual comparison."

1. Find any task in the **Weekly Tasks** list
2. Click the **clock icon** on the task
3. In the modal:
   - Hours: `4`
   - Date: Today's date
   - Notes: `"Completed endpoint schema design"`
4. Click **Log Time**
5. Show the task's **Actual Hours** updating immediately
6. Navigate to the **Dashboard Overview**
7. Show the **Total Hours Logged** stat card has increased

**Key Points to Highlight:**
- Time logging is fast (3 clicks from task to logged entry)
- Actual vs estimated variance visible at task level and dashboard level

---

### ⏱️ Minute 5: Team Performance & Notifications (4:15 – 5:00)

**Talking Points:**
> "Managers get team-wide visibility without constant status update meetings."

1. Click the **Team Performance** tab
2. Show the bar chart comparing team members by:
   - Completed tasks
   - Hours logged
3. Point out that data is real-time — no manual report generation

4. Click the **Notification Bell**
5. Show the notification list with overdue and reminder entries
6. Click **Mark All as Read**
7. Show badge disappears

**Closing:**
> "In 5 minutes, you saw the complete workflow: Strategic goals → Monthly plans → Weekly tasks → Time tracking → Team analytics. No context switching, no manual reports, everything in one place."

---

## 🧪 Testing Scenarios

Use these scenarios to validate key features:

### Scenario 1: Full Hierarchy Test

```
1. Register a new account with a unique email
2. Create a Quarterly Goal (Q1 2026)
3. Create a Monthly Plan linked to the goal
4. Create a Weekly Task linked to the plan
5. Log 2 hours on the task
6. Verify task.actual_hours = 2 in the task list
7. Update task status to "completed"
8. Check Dashboard — completed count should increase by 1
```

### Scenario 2: Task Dependency Test

```
1. Create Task A: "Design Schema"
2. Note Task A's ID from the task list
3. Create Task B: "Build API" with depends_on = Task A's ID
4. Attempt to complete Task B before Task A
5. Expected: Task B shows "blocked" or warning state
```

### Scenario 3: Notification Test

```
1. Create a task with due_date = YESTERDAY
2. Wait for or manually trigger the cron job
   - OR: POST to /api/seed to get pre-made overdue tasks
3. Navigate to Notification Bell
4. Expected: "Overdue Task" notification appears
```

### Scenario 4: Rate Limiting Test

```
1. Attempt login with wrong password 5 times rapidly
2. On the 6th attempt, expected response:
   HTTP 429: "Too many login attempts, please try again later"
3. Wait 15 minutes — access restored
```

### Scenario 5: Multi-User Team Performance

```
1. Log in as alice@tackstracker.com
2. Create and complete 3 tasks
3. Log 5 hours across those tasks
4. Log out, log in as bob@tackstracker.com
5. Create and complete 1 task
6. Log out, log in as demo@tackstracker.com
7. Navigate to Team Performance tab
8. Expected: Alice shows 3 completed tasks, Bob shows 1
```

### Scenario 6: Dashboard Stats Accuracy

```
1. Note current stats: totalTasks, completedTasks, totalHoursLogged
2. Create 1 new task
3. Expected: totalTasks increases by 1
4. Log 3 hours on any task
5. Expected: totalHoursLogged increases by 3
6. Mark 1 task as "completed"
7. Expected: completedTasks increases by 1, pendingTasks decreases by 1
```

---

## 📱 Mobile Demo Guide

TacksTracker is mobile-responsive. For mobile-specific demos:

### Recommended Mobile Viewports

| Device | Width | Height |
|--------|-------|--------|
| iPhone 14 | 393px | 852px |
| iPhone SE | 375px | 667px |
| Samsung Galaxy S21 | 360px | 800px |
| iPad | 768px | 1024px |

### DevTools Setup for Mobile Demo

1. Open Chrome DevTools (`F12`)
2. Click the **Toggle Device Toolbar** icon (or `Ctrl+Shift+M`)
3. Select `iPhone 14` from the device dropdown
4. Reload the page

### Mobile-Specific Points to Highlight

- Responsive navigation adapts to mobile screen size
- Stat cards stack vertically on small screens
- Forms are touch-friendly with large tap targets
- Charts resize responsively
- Notification bell accessible from mobile header

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Symptoms:** Login fails, API calls return network errors

**Solutions:**
1. Verify backend is running: `curl https://<backend-url>/health`
2. Check `REACT_APP_API_URL` in frontend `.env` matches the backend URL
3. Verify CORS is configured to allow the frontend origin
4. Check browser console for CORS errors

---

### Issue: "Invalid token" after login

**Symptoms:** User logs in but immediately gets 401 errors on all API calls

**Solutions:**
1. Clear localStorage: `localStorage.clear()` in browser console
2. Log out and log back in
3. Verify `JWT_SECRET` hasn't changed on the backend since the token was issued
4. Check token expiry (tokens expire after 7 days)

---

### Issue: Demo data not showing

**Symptoms:** Logged in as demo account but no goals/tasks visible

**Solutions:**
1. Re-run the seed script: `POST /api/seed`
2. Verify the seed ran against the correct database
3. Check the database via Neon dashboard — tables should have rows
4. Confirm you're logged in as `demo@tackstracker.com`, not a different account

---

### Issue: Charts not rendering

**Symptoms:** Dashboard shows blank white space where charts should be

**Solutions:**
1. Wait for data to load (charts require data to render)
2. Hard refresh the page (`Ctrl+Shift+R`)
3. Check browser console for JavaScript errors
4. Verify Recharts is installed: `cd frontend && npm list recharts`

---

### Issue: Notifications not appearing

**Symptoms:** Notification bell shows 0 even though tasks are overdue

**Solutions:**
1. Create tasks with past due dates to trigger overdue status
2. Cron jobs run at 9 AM and 6 PM — outside those times, manually trigger:
   ```bash
   # Temporary workaround — directly insert a notification via API or DB
   POST /api/seed  # includes pre-made overdue tasks + notifications
   ```
3. Click the bell once to trigger initial notification fetch (see [KI-003](./KNOWN_ISSUES.md))

---

## 🔒 Security Notes

1. **Demo passwords are weak by design** — easy to remember for demonstrations only
2. **Never use these credentials in production** — change all passwords before going live
3. **Seed data is publicly accessible** — the `/api/seed` endpoint should be disabled in production
4. **Demo accounts have no special permissions** — they use the standard `member` role
5. **Data created during demos is persistent** — clear demo data via the Neon dashboard or re-run seed to reset
6. **Token expiry is 7 days** — demo sessions automatically expire after one week

### Disabling Seed Endpoint in Production

```javascript
// server.js — Disable seed in production
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/seed', async (req, res) => {
    // seed logic
  });
}
```

---

**Document Maintainer:** TacksTracker Team  
**Version:** 1.5.0  
**Last Updated:** March 2026
