# 🐛 Known Issues
## TacksTracker - v1.5.0

**Last Updated:** March 2026  
**Total Open Issues:** 8  
**Critical:** 1 | **Major:** 3 | **Moderate:** 3 | **Minor:** 1

---

## 📋 Table of Contents

- [Critical Issues](#-critical-issues)
- [Major Issues](#-major-issues)
- [Moderate Issues](#-moderate-issues)
- [Minor Issues](#-minor-issues)
- [Reporting New Issues](#reporting-new-issues)

---

## 🔴 Critical Issues

---

### [KI-001] Progress & Status Not Saving on CREATE

**Severity:** 🔴 Critical  
**Component:** GoalManager, PlanManager  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
When creating a new Quarterly Goal or Monthly Plan, the `progress` and `status` fields set by the user during creation are silently ignored. The record is always saved with defaults (`status: 'pending'`, `progress: 0`) regardless of what the user selected in the form.

**Steps to Reproduce:**
1. Log in to TacksTracker
2. Navigate to **Quarterly Goals** tab
3. Click **Create New Goal**
4. Set **Status** to `in_progress` and **Progress** to `50`
5. Click **Submit**
6. Observe the newly created goal — status shows `pending` and progress shows `0`

**Expected Behavior:**  
Goal is created with `status: 'in_progress'` and `progress: 50` as entered.

**Actual Behavior:**  
Goal is created with default values `status: 'pending'` and `progress: 0`.

**Workaround:**  
After creating the goal, immediately click **Edit** and update the status and progress fields. The edit operation correctly saves all values.

**Fix Required:**
```javascript
// GoalManager.js — createGoal handler
const handleCreate = async (formData) => {
  const payload = {
    title: formData.title,
    description: formData.description,
    quarter: formData.quarter,
    year: formData.year,
    // MISSING — add these two lines:
    status: formData.status || 'pending',
    progress: formData.progress || 0,
  };
  await goalsAPI.create(payload);
};
```

---

## 🟠 Major Issues

---

### [KI-002] No Loading States on Data Fetch

**Severity:** 🟠 Major  
**Component:** GoalManager, PlanManager, TaskManager  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
When the app fetches goals, plans, or tasks from the API, there is no loading spinner or skeleton UI shown. The content area remains blank until data arrives, causing users to think the app is broken.

**Steps to Reproduce:**
1. Log in on a slow network connection (throttle to 3G in DevTools)
2. Navigate to any Manager tab (Goals, Plans, Tasks)
3. Notice the content area is completely blank for 2-5 seconds

**Expected Behavior:**  
A loading spinner or skeleton UI is displayed while data is being fetched.

**Actual Behavior:**  
Blank content area — no indication that data is loading.

**Workaround:**  
Wait a few seconds. Data will appear once the API call completes.

**Fix Required:**
```javascript
// Add loading state to each manager component
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await goalsAPI.getAll();
    setGoals(data);
  } finally {
    setLoading(false);
  }
};

// In JSX:
{loading ? <div className="spinner" /> : <GoalList goals={goals} />}
```

---

### [KI-003] Notification Bell Shows No Notifications on First Load

**Severity:** 🟠 Major  
**Component:** NotificationBell  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
The notification bell always shows `0` unread notifications when the page first loads, even if the user has unread notifications in the database. Notifications only appear after manually clicking the bell and reopening it.

**Steps to Reproduce:**
1. Log in to TacksTracker
2. Observe the notification bell — shows `0` badge
3. Click the bell — notifications appear correctly
4. Close and reopen the bell — unread count now shows correctly

**Expected Behavior:**  
Unread count is fetched and displayed immediately when the Layout component mounts.

**Actual Behavior:**  
Unread count defaults to `0` until the bell is clicked once.

**Workaround:**  
Click the notification bell once to trigger the initial fetch.

**Fix Required:**
```javascript
// NotificationBell.js
useEffect(() => {
  // Fetch unread count on mount and set up polling
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 60000); // poll every minute
  return () => clearInterval(interval);
}, []);
```

---

### [KI-004] No Client-Side Form Validation

**Severity:** 🟠 Major  
**Component:** All Forms (GoalManager, PlanManager, TaskManager)  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
Forms have no client-side validation. Users can submit empty required fields or invalid values (e.g., `progress: 999`) and the only feedback comes from the backend API error response, which is delayed and less specific.

**Steps to Reproduce:**
1. Navigate to **Weekly Tasks** tab
2. Click **Create New Task**
3. Leave the **Title** field empty
4. Click **Submit**
5. Observe — no inline error, toast shows generic API error message

**Expected Behavior:**  
Immediate inline validation highlighting the required **Title** field before the form is submitted.

**Actual Behavior:**  
Form submits to the API, which returns a 400 error that is displayed as a generic toast.

**Workaround:**  
Ensure all required fields are filled before submitting. Refer to the field labels marked with `*`.

**Fix Required:**
```javascript
// Add validation before submit
const validateForm = (data) => {
  const errors = {};
  if (!data.title?.trim()) errors.title = 'Title is required';
  if (data.week_number < 1 || data.week_number > 53) errors.week_number = 'Must be 1-53';
  return errors;
};

const handleSubmit = (e) => {
  e.preventDefault();
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
  // proceed with API call
};
```

---

## 🟡 Moderate Issues

---

### [KI-005] No Delete Confirmation Dialog

**Severity:** 🟡 Moderate  
**Component:** GoalManager, PlanManager, TaskManager  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
Clicking the **Delete** button immediately deletes the record without any confirmation prompt. There is no undo. This can lead to accidental data loss.

**Steps to Reproduce:**
1. Navigate to any Manager tab
2. Click the **Delete** (trash) icon on any record
3. Record is immediately deleted with no confirmation

**Expected Behavior:**  
A confirmation dialog asking "Are you sure you want to delete [title]? This cannot be undone." with **Confirm** and **Cancel** buttons.

**Actual Behavior:**  
Record is deleted immediately on click.

**Workaround:**  
Re-create the deleted record manually if accidentally deleted.

**Fix Required:**
```javascript
const handleDelete = (id, title) => {
  if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
    goalsAPI.delete(id).then(fetchGoals);
  }
};
```

---

### [KI-006] AI Assistant Button Visible Without API Key

**Severity:** 🟡 Moderate  
**Component:** AIChatWidget  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
The AI Assistant button/widget is visible and clickable in the UI even when the `GROQ_API_KEY` environment variable is not configured on the backend. Clicking it shows an unhelpful error message from the server.

**Steps to Reproduce:**
1. Deploy the backend without setting `GROQ_API_KEY`
2. Log in to the frontend
3. Observe AI chat button is visible
4. Click it and send a query
5. See a confusing error: `"Internal server error"`

**Expected Behavior:**  
The AI button should either: (a) be hidden/disabled when the API key isn't configured, or (b) show a clear message: "AI features are not configured. Contact your administrator."

**Actual Behavior:**  
Button shows and throws a generic 500 error on use.

**Workaround:**  
Configure `GROQ_API_KEY` in backend `.env` or Vercel environment variables.

**Fix Required:**
```javascript
// Backend: Add route to check AI availability
app.get('/api/ai/status', (req, res) => {
  res.json({ available: !!process.env.GROQ_API_KEY });
});

// Frontend: Check on mount and hide widget accordingly
const [aiAvailable, setAiAvailable] = useState(false);
useEffect(() => {
  api.get('/ai/status').then(r => setAiAvailable(r.data.available));
}, []);
```

---

### [KI-007] No Autocomplete on "Depends On" Task Field

**Severity:** 🟡 Moderate  
**Component:** TaskManager (Create/Edit Form)  
**Reported:** March 2026  
**Fix ETA:** v2.0.0

**Description:**  
The "Depends On" field in the task form accepts a raw task ID number. There is no searchable dropdown or autocomplete to help users find the correct task ID. Users must manually look up task IDs from the task list.

**Steps to Reproduce:**
1. Navigate to **Weekly Tasks** tab
2. Click **Create New Task**
3. Find the "Depends On" field — it is a plain number input
4. User must know the exact task ID to enter

**Expected Behavior:**  
A searchable dropdown showing task titles with their IDs, allowing users to select by name.

**Actual Behavior:**  
Raw numeric input with no guidance.

**Workaround:**  
Note the ID shown in the task list before creating a dependent task.

**Fix Required:**
```javascript
// Replace number input with a select dropdown
<select name="depends_on" value={formData.depends_on} onChange={handleChange}>
  <option value="">None</option>
  {allTasks.map(task => (
    <option key={task.id} value={task.id}>
      #{task.id} — {task.title}
    </option>
  ))}
</select>
```

---

## ⚪ Minor Issues

---

### [KI-008] Week Number Not Auto-Populated in Task Form

**Severity:** ⚪ Minor  
**Component:** TaskManager  
**Reported:** March 2026  
**Fix ETA:** v1.6.0

**Description:**  
When creating a new Weekly Task, the `week_number` and `year` fields default to `1` and the current year respectively. The form does not auto-calculate the current ISO week number, requiring the user to enter it manually.

**Steps to Reproduce:**
1. Navigate to **Weekly Tasks** tab
2. Click **Create New Task**
3. Observe **Week Number** field defaults to `1` instead of the current week

**Expected Behavior:**  
`week_number` defaults to the current ISO week and `year` defaults to the current year.

**Actual Behavior:**  
`week_number` defaults to `1`.

**Workaround:**  
Manually enter the current week number (available at [whatweek.com](https://whatweek.com)).

**Fix Required:**
```javascript
import { getISOWeek, getYear } from 'date-fns';

const defaultFormData = {
  title: '',
  week_number: getISOWeek(new Date()),  // auto-populate
  year: getYear(new Date()),             // auto-populate
  priority: 'medium',
  // ...
};
```

---

## 📝 Reporting New Issues

If you discover a bug not listed here, please report it:

1. **GitHub Issues:** [Open a new issue](https://github.com/GorathePranav19/tackstracker-/issues)
2. **Include:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS version
   - Screenshot or screen recording (if applicable)
3. **Severity Guide:**
   - 🔴 **Critical** — Data loss, security risk, core workflow broken
   - 🟠 **Major** — Key feature missing or severely degraded
   - 🟡 **Moderate** — Feature works but with poor UX
   - ⚪ **Minor** — Cosmetic or low-impact inconvenience

---

**Document Maintainer:** Engineering Team  
**Review Cycle:** Updated with each release  
**Version:** 1.5.0
