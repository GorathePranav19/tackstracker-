require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const { runQuery, getOne, getAll } = require('./database');
const {
    goalSchema,
    planSchema,
    taskSchema,
    timeLogSchema,
    registerSchema,
    loginSchema,
    validate
} = require('./middleware/validation');
const aiRoutes = require('./routes/ai.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// ============================================
// SENTRY INITIALIZATION
// ============================================
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('✅ Sentry error tracking initialized');
}

// ============================================
// ENVIRONMENT VALIDATION
// ============================================
const requiredEnvVars = ['JWT_SECRET', 'POSTGRES_URL'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('⚠️  Please check your .env file');
    // Don't exit in production to allow deployment, but warn
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet());

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // only 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// CORS CONFIGURATION
// ============================================
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://tackstracker.vercel.app',
            'https://tackstracker-frontend.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean)
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Sentry request handler (must be first)
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
}

// ============================================
// BASIC MIDDLEWARE
// ============================================
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await runQuery('SELECT 1');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : error.message
        });
    }
});

// ============================================
// AI ROUTES
// ============================================
app.use('/api/ai', aiRoutes);

// Register new user
app.post('/api/auth/register', authLimiter, validate(registerSchema), async (req, res) => {
    try {
        const { name, email, password, role = 'member' } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await getOne('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await runQuery(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ============================================
// QUARTERLY GOALS ROUTES
// ============================================

// Get all quarterly goals for current user
app.get('/api/quarterly-goals', authenticateToken, async (req, res) => {
    try {
        const goals = await getAll(
            'SELECT * FROM quarterly_goals WHERE user_id = ? ORDER BY year DESC, quarter DESC',
            [req.user.id]
        );
        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create quarterly goal
app.post('/api/quarterly-goals', authenticateToken, validate(goalSchema), async (req, res) => {
    try {
        const { title, description, quarter, year } = req.body;

        if (!title || !quarter || !year) {
            return res.status(400).json({ error: 'Title, quarter, and year are required' });
        }

        const result = await runQuery(
            'INSERT INTO quarterly_goals (user_id, title, description, quarter, year) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, description, quarter, year]
        );

        res.status(201).json({
            message: 'Quarterly goal created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update quarterly goal
app.put('/api/quarterly-goals/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, quarter, year, status, progress } = req.body;

        const result = await runQuery(
            `UPDATE quarterly_goals 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           quarter = COALESCE(?, quarter),
           year = COALESCE(?, year),
           status = COALESCE(?, status),
           progress = COALESCE(?, progress),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
            [title, description, quarter, year, status, progress, id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete quarterly goal
app.delete('/api/quarterly-goals/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery(
            'DELETE FROM quarterly_goals WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// ============================================
// MONTHLY PLANS ROUTES
// ============================================

// Get all monthly plans for current user
app.get('/api/monthly-plans', authenticateToken, async (req, res) => {
    try {
        const { quarterly_goal_id } = req.query;

        let query = 'SELECT * FROM monthly_plans WHERE user_id = ?';
        let params = [req.user.id];

        if (quarterly_goal_id) {
            query += ' AND quarterly_goal_id = ?';
            params.push(quarterly_goal_id);
        }

        query += ' ORDER BY year DESC, month DESC';

        const plans = await getAll(query, params);
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Create monthly plan
app.post('/api/monthly-plans', authenticateToken, validate(planSchema), async (req, res) => {
    try {
        const { title, description, month, year, quarterly_goal_id } = req.body;

        if (!title || !month || !year) {
            return res.status(400).json({ error: 'Title, month, and year are required' });
        }

        const result = await runQuery(
            'INSERT INTO monthly_plans (user_id, quarterly_goal_id, title, description, month, year) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, quarterly_goal_id || null, title, description, month, year]
        );

        res.status(201).json({
            message: 'Monthly plan created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
});

// Update monthly plan
app.put('/api/monthly-plans/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, month, year, status, progress, quarterly_goal_id } = req.body;

        const result = await runQuery(
            `UPDATE monthly_plans 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           month = COALESCE(?, month),
           year = COALESCE(?, year),
           status = COALESCE(?, status),
           progress = COALESCE(?, progress),
           quarterly_goal_id = COALESCE(?, quarterly_goal_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
            [title, description, month, year, status, progress, quarterly_goal_id, id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Plan not found or unauthorized' });
        }

        res.json({ message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// Delete monthly plan
app.delete('/api/monthly-plans/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery(
            'DELETE FROM monthly_plans WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Plan not found or unauthorized' });
        }

        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

// ============================================
// WEEKLY TASKS ROUTES
// ============================================

// Get all weekly tasks for current user
app.get('/api/weekly-tasks', authenticateToken, async (req, res) => {
    try {
        const { monthly_plan_id, status } = req.query;

        let query = 'SELECT * FROM weekly_tasks WHERE user_id = ?';
        let params = [req.user.id];

        if (monthly_plan_id) {
            query += ' AND monthly_plan_id = ?';
            params.push(monthly_plan_id);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY due_date ASC, priority DESC';

        const tasks = await getAll(query, params);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create weekly task
app.post('/api/weekly-tasks', authenticateToken, validate(taskSchema), async (req, res) => {
    try {
        const {
            title,
            description,
            week_number,
            year,
            monthly_plan_id,
            priority = 'medium',
            estimated_hours = 0,
            due_date,
            is_urgent = 0,
            depends_on
        } = req.body;

        if (!title || !week_number || !year) {
            return res.status(400).json({ error: 'Title, week number, and year are required' });
        }

        const result = await runQuery(
            `INSERT INTO weekly_tasks 
       (user_id, monthly_plan_id, title, description, week_number, year, priority, estimated_hours, due_date, is_urgent, depends_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, monthly_plan_id || null, title, description, week_number, year, priority, estimated_hours, due_date, is_urgent, depends_on || null]
        );

        res.status(201).json({
            message: 'Weekly task created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update weekly task
app.put('/api/weekly-tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            week_number,
            year,
            priority,
            status,
            estimated_hours,
            actual_hours,
            due_date,
            is_urgent,
            depends_on,
            monthly_plan_id
        } = req.body;

        const result = await runQuery(
            `UPDATE weekly_tasks 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           week_number = COALESCE(?, week_number),
           year = COALESCE(?, year),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           estimated_hours = COALESCE(?, estimated_hours),
           actual_hours = COALESCE(?, actual_hours),
           due_date = COALESCE(?, due_date),
           is_urgent = COALESCE(?, is_urgent),
           depends_on = COALESCE(?, depends_on),
           monthly_plan_id = COALESCE(?, monthly_plan_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
            [title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent, depends_on, monthly_plan_id, id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete weekly task
app.delete('/api/weekly-tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery(
            'DELETE FROM weekly_tasks WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// ============================================
// TIME LOGS ROUTES
// ============================================

// Get time logs
app.get('/api/time-logs', authenticateToken, async (req, res) => {
    try {
        const { task_id } = req.query;

        let query = `
      SELECT tl.*, wt.title as task_title, u.name as user_name
      FROM time_logs tl
      JOIN weekly_tasks wt ON tl.task_id = wt.id
      JOIN users u ON tl.user_id = u.id
      WHERE tl.user_id = ?
    `;
        let params = [req.user.id];

        if (task_id) {
            query += ' AND tl.task_id = ?';
            params.push(task_id);
        }

        query += ' ORDER BY tl.date DESC';

        const logs = await getAll(query, params);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching time logs:', error);
        res.status(500).json({ error: 'Failed to fetch time logs' });
    }
});

// Create time log
app.post('/api/time-logs', authenticateToken, validate(timeLogSchema), async (req, res) => {
    try {
        const { task_id, hours, date, notes } = req.body;

        if (!task_id || !hours || !date) {
            return res.status(400).json({ error: 'Task ID, hours, and date are required' });
        }

        // Verify task belongs to user
        const task = await getOne(
            'SELECT * FROM weekly_tasks WHERE id = ? AND user_id = ?',
            [task_id, req.user.id]
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        // Create time log
        const result = await runQuery(
            'INSERT INTO time_logs (task_id, user_id, hours, date, notes) VALUES (?, ?, ?, ?, ?)',
            [task_id, req.user.id, hours, date, notes]
        );

        // Update task actual hours
        await runQuery(
            'UPDATE weekly_tasks SET actual_hours = actual_hours + ? WHERE id = ?',
            [hours, task_id]
        );

        res.status(201).json({
            message: 'Time log created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Error creating time log:', error);
        res.status(500).json({ error: 'Failed to create time log' });
    }
});

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

// Get notifications for current user
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await getAll(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await runQuery(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const stats = {
            totalGoals: 0,
            totalPlans: 0,
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            totalHoursLogged: 0,
            overdueTasksCount: 0
        };

        // Get counts
        const goalCount = await getOne('SELECT COUNT(*) as count FROM quarterly_goals WHERE user_id = ?', [req.user.id]);
        const planCount = await getOne('SELECT COUNT(*) as count FROM monthly_plans WHERE user_id = ?', [req.user.id]);
        const taskCount = await getOne('SELECT COUNT(*) as count FROM weekly_tasks WHERE user_id = ?', [req.user.id]);
        const completedCount = await getOne('SELECT COUNT(*) as count FROM weekly_tasks WHERE user_id = ? AND status = "completed"', [req.user.id]);
        const pendingCount = await getOne('SELECT COUNT(*) as count FROM weekly_tasks WHERE user_id = ? AND status = "pending"', [req.user.id]);
        const inProgressCount = await getOne('SELECT COUNT(*) as count FROM weekly_tasks WHERE user_id = ? AND status = "in_progress"', [req.user.id]);
        const hoursSum = await getOne('SELECT SUM(hours) as total FROM time_logs WHERE user_id = ?', [req.user.id]);
        const overdueCount = await getOne('SELECT COUNT(*) as count FROM weekly_tasks WHERE user_id = ? AND due_date < date("now") AND status != "completed"', [req.user.id]);

        stats.totalGoals = goalCount.count;
        stats.totalPlans = planCount.count;
        stats.totalTasks = taskCount.count;
        stats.completedTasks = completedCount.count;
        stats.pendingTasks = pendingCount.count;
        stats.inProgressTasks = inProgressCount.count;
        stats.totalHoursLogged = hoursSum.total || 0;
        stats.overdueTasksCount = overdueCount.count;

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get team performance (admin only or all users)
app.get('/api/dashboard/team-performance', authenticateToken, async (req, res) => {
    try {
        const teamStats = await getAll(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT wt.id) as total_tasks,
        SUM(CASE WHEN wt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN wt.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN wt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        COALESCE(SUM(tl.hours), 0) as total_hours
      FROM users u
      LEFT JOIN weekly_tasks wt ON u.id = wt.user_id
      LEFT JOIN time_logs tl ON u.id = tl.user_id
      GROUP BY u.id
      ORDER BY completed_tasks DESC
    `);

        res.json(teamStats);
    } catch (error) {
        console.error('Error fetching team performance:', error);
        res.status(500).json({ error: 'Failed to fetch team performance' });
    }
});

// ============================================
// SCHEDULED TASKS (CRON JOBS)
// ============================================

// Check for overdue tasks and send notifications (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
    console.log('Running overdue tasks check...');

    try {
        const overdueTasks = await getAll(`
      SELECT wt.*, u.id as user_id, u.name as user_name
      FROM weekly_tasks wt
      JOIN users u ON wt.user_id = u.id
      WHERE wt.due_date < date('now') AND wt.status != 'completed'
    `);

        for (const task of overdueTasks) {
            await runQuery(
                'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
                [
                    task.user_id,
                    'overdue',
                    'Overdue Task',
                    `Task "${task.title}" is overdue. Due date was ${task.due_date}.`
                ]
            );
        }

        console.log(`Created ${overdueTasks.length} overdue notifications`);
    } catch (error) {
        console.error('Error in overdue tasks check:', error);
    }
});

// Check for tasks due tomorrow and send reminders (runs daily at 6 PM)
cron.schedule('0 18 * * *', async () => {
    console.log('Running due tomorrow tasks check...');

    try {
        const dueTomorrowTasks = await getAll(`
      SELECT wt.*, u.id as user_id, u.name as user_name
      FROM weekly_tasks wt
      JOIN users u ON wt.user_id = u.id
      WHERE wt.due_date = date('now', '+1 day') AND wt.status != 'completed'
    `);

        for (const task of dueTomorrowTasks) {
            await runQuery(
                'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
                [
                    task.user_id,
                    'reminder',
                    'Task Due Tomorrow',
                    `Reminder: Task "${task.title}" is due tomorrow (${task.due_date}).`
                ]
            );
        }

        console.log(`Created ${dueTomorrowTasks.length} reminder notifications`);
    } catch (error) {
        console.error('Error in due tomorrow tasks check:', error);
    }
});

// ============================================
// DATABASE SEEDING ENDPOINT
// ============================================

app.post('/api/seed', async (req, res) => {
    try {
        console.log('🌱 Starting database seeding...');

        // Create demo user
        const hashedPassword = await bcrypt.hash('demo123', 10);
        const userResult = await runQuery(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
            ['Demo User', 'demo@example.com', hashedPassword, 'admin']
        );
        const userId = userResult.id;

        // Create quarterly goals
        const goal1 = await runQuery(
            'INSERT INTO quarterly_goals (user_id, title, description, quarter, year, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [userId, 'Launch Product V2.0', 'Complete redesign and launch of our flagship product with new features', 1, 2026, 'in_progress', 65]
        );

        const goal2 = await runQuery(
            'INSERT INTO quarterly_goals (user_id, title, description, quarter, year, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [userId, 'Improve Team Productivity', 'Implement new tools and processes to boost team efficiency by 30%', 1, 2026, 'in_progress', 45]
        );

        // Create monthly plans
        const plan1 = await runQuery(
            'INSERT INTO monthly_plans (user_id, quarterly_goal_id, title, description, month, year, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [userId, goal1.id, 'Backend API Development', 'Build new REST API endpoints and database schema', 3, 2026, 'in_progress', 70]
        );

        const plan2 = await runQuery(
            'INSERT INTO monthly_plans (user_id, quarterly_goal_id, title, description, month, year, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [userId, goal2.id, 'Implement Project Management Tool', 'Set up and train team on new PM software', 2, 2026, 'in_progress', 60]
        );

        // Create weekly tasks
        await runQuery(
            'INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, plan1.id, 'Design database schema', 'Create ERD and define all tables and relationships', 10, 2026, 'high', 'completed', 8, 10, '2026-03-07', 0]
        );

        await runQuery(
            'INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, plan1.id, 'Implement authentication endpoints', 'Build login, register, and JWT token management', 11, 2026, 'high', 'completed', 12, 14, '2026-03-14', 0]
        );

        await runQuery(
            'INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, plan1.id, 'Create CRUD endpoints for goals', 'Build API endpoints for quarterly goals management', 12, 2026, 'medium', 'in_progress', 10, 6, '2026-03-21', 1]
        );

        await runQuery(
            'INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, plan2.id, 'Research PM tools', 'Evaluate top 5 project management tools', 9, 2026, 'high', 'completed', 4, 5, '2026-02-28', 0]
        );

        await runQuery(
            'INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, plan2.id, 'Train team members', 'Conduct training sessions for all team members', 11, 2026, 'medium', 'in_progress', 8, 4, '2026-03-14', 0]
        );

        // Create notifications
        await runQuery(
            'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?)',
            [userId, 'reminder', 'Task Due Soon', 'Task "Create CRUD endpoints for goals" is due in 3 days', 0]
        );

        await runQuery(
            'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?)',
            [userId, 'general', 'Welcome!', 'Welcome to Team Goal Tracker! Your demo data has been loaded.', 1]
        );

        console.log('✅ Database seeded successfully');

        res.json({
            message: 'Database seeded successfully',
            credentials: {
                email: 'demo@example.com',
                password: 'demo123'
            }
        });
    } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ error: 'Failed to seed database', details: error.message });
    }
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    // Don't leak error details in production
    const errorResponse = {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    };

    res.status(err.status || 500).json(errorResponse);
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ API ready at http://localhost:${PORT}/api`);
    console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
    console.log(`📝 Validation: Input validation enabled`);
});
