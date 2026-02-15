require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { runQuery, getOne, getAll } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: ['https://tackstracker.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Register new user
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
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
app.post('/api/quarterly-goals', authenticateToken, async (req, res) => {
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
app.post('/api/monthly-plans', authenticateToken, async (req, res) => {
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
app.post('/api/weekly-tasks', authenticateToken, async (req, res) => {
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
app.post('/api/time-logs', authenticateToken, async (req, res) => {
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
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ API ready at http://localhost:${PORT}/api`);
});
