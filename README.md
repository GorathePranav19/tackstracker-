# 🎯 Team Goal & Task Tracker

A comprehensive web application for tracking quarterly goals, monthly plans, and weekly tasks across your team.

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

### 📊 Hierarchical Planning
- **Quarterly Goals** → Set long-term objectives
- **Monthly Plans** → Break goals into monthly milestones
- **Weekly Tasks** → Create actionable weekly tasks
- Full parent-child relationship tracking

### ⚡ Task Management
- Create, update, and delete tasks
- Set priorities (High, Medium, Low)
- Mark tasks as urgent
- Task dependencies (Task B waits for Task A)
- Estimated vs actual time tracking
- Due date management

### 📈 Visual Dashboards
- Personal dashboard with task overview
- Team performance dashboard
- Progress charts and graphs
- Real-time statistics
- Completion percentages

### ⏱️ Time Tracking
- Log hours spent on tasks
- View time logs by task, user, or date
- Automatic calculation of total hours
- Compare estimated vs actual time

### 🔔 Smart Notifications
- Automatic reminders for tasks due tomorrow
- Overdue task alerts
- Real-time notification bell
- Auto-refresh every 30 seconds

### 👥 User Management
- Secure user authentication
- Role-based access (Admin/Member)
- Team member profiles
- 6-member team support (easily scalable)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Local Setup

```bash
# Clone or download this project
cd team-goal-tracker

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env and set your JWT_SECRET
npm start

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm start
```

Visit: http://localhost:3000

---

## 📦 Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - API calls
- **Lucide React** - Icons
- **date-fns** - Date utilities

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **node-cron** - Scheduled tasks

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Render
1. Push code to GitHub
2. Go to https://render.com
3. New → Blueprint
4. Connect your repository
5. Deploy automatically

### Option 3: Railway
1. Push code to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Select your repository
5. Add environment variables
6. Deploy

**📚 Full deployment guide:** See `DEPLOYMENT_GUIDE.md`

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
DB_PATH=./team_tracker.db
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Quarterly Goals
- `GET /api/quarterly-goals` - Get all goals
- `POST /api/quarterly-goals` - Create goal
- `PUT /api/quarterly-goals/:id` - Update goal
- `DELETE /api/quarterly-goals/:id` - Delete goal

### Monthly Plans
- `GET /api/monthly-plans` - Get all plans
- `POST /api/monthly-plans` - Create plan
- `PUT /api/monthly-plans/:id` - Update plan
- `DELETE /api/monthly-plans/:id` - Delete plan

### Weekly Tasks
- `GET /api/weekly-tasks` - Get all tasks
- `POST /api/weekly-tasks` - Create task
- `PUT /api/weekly-tasks/:id` - Update task
- `DELETE /api/weekly-tasks/:id` - Delete task

### Time Tracking
- `POST /api/time-logs` - Log time for task
- `GET /api/time-logs` - Get time logs

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/team-performance` - Get team data

---

## 🎨 Features Explained

### Quarterly → Monthly → Weekly Flow
1. Create a **Quarterly Goal** (Q1 2024: "Launch new product")
2. Break it into **Monthly Plans** (Jan: "Design phase", Feb: "Development")
3. Create **Weekly Tasks** under each plan (Week 1: "Create wireframes")

### Task Dependencies
- Mark Task B to depend on Task A
- System shows which tasks are blocked
- Helps prioritize work correctly

### Time Tracking
- Estimate: 5 hours
- Log actual time as you work
- System tracks variance automatically
- See where time goes

### Automatic Reminders
- **9 AM Daily**: Check for overdue tasks → Send notifications
- **6 PM Daily**: Check tasks due tomorrow → Send reminders
- Notifications appear in-app with bell icon

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected API routes
- ✅ SQL injection prevention
- ✅ CORS enabled
- ✅ Environment variable protection

---

## 📁 Project Structure

```
team-goal-tracker/
├── backend/
│   ├── server.js          # Main server file
│   ├── database.js        # Database setup
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Auth/    # Login, Register
│   │   │   ├── Dashboard/ # Main dashboard
│   │   │   ├── Tasks/   # Goal, Plan, Task managers
│   │   │   ├── Notifications/ # Notification bell
│   │   │   └── Layout/  # App layout
│   │   ├── context/     # Auth context
│   │   ├── services/    # API services
│   │   ├── App.js       # Main app component
│   │   ├── index.js     # Entry point
│   │   └── styles.css   # Global styles
│   ├── public/
│   └── package.json     # Frontend dependencies
├── vercel.json          # Vercel config
├── render.yaml          # Render config
├── railway.json         # Railway config
├── DEPLOYMENT_GUIDE.md  # Deployment instructions
└── README.md            # This file
```

---

## 🐛 Troubleshooting

**Issue: Cannot connect to backend**
```bash
# Check if backend is running on port 5000
# Verify REACT_APP_API_URL in frontend/.env
# Check CORS settings in backend/server.js
```

**Issue: Login fails**
```bash
# Verify JWT_SECRET is set in backend/.env
# Clear browser localStorage
# Check browser console for errors
```

**Issue: Database errors**
```bash
# Delete team_tracker.db and restart backend
# Check file write permissions
# Ensure SQLite3 is installed
```

---

## 🎯 Usage Example

### For Team Lead:
1. Login as admin
2. Create Q1 2024 goal: "Increase sales by 20%"
3. Create January plan: "Launch marketing campaign"
4. Assign weekly tasks to team members
5. Monitor team dashboard
6. Track completion rates

### For Team Member:
1. Login to your account
2. View assigned weekly tasks
3. Update task status (Pending → In Progress → Completed)
4. Log time spent on each task
5. View your personal dashboard
6. Check notifications for reminders

---

## 📄 License

MIT License - feel free to use for your team!

---

## 🤝 Support

Need help? 

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review troubleshooting section above
3. Check the API documentation

---

## 🎉 Credits

Built with ❤️ for teams who want to stay organized and achieve their goals.

**Happy Tracking! 🚀**

---

**Version:** 1.0.0  
**Status:** Production Ready ✅
