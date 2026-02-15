require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🌱 Starting database seeding...');

        // 1. Create demo users
        console.log('👤 Creating demo users...');
        const hashedPassword = await bcrypt.hash('demo123', 10);

        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
            ['Demo User', 'demo@example.com', hashedPassword, 'admin']
        );
        const userId = userResult.rows[0].id;
        console.log(`✅ Created user: demo@example.com (password: demo123)`);

        // 2. Create quarterly goals
        console.log('🎯 Creating quarterly goals...');
        const goals = [
            {
                title: 'Launch Product V2.0',
                description: 'Complete redesign and launch of our flagship product with new features',
                quarter: 1,
                year: 2026,
                status: 'in_progress',
                progress: 65
            },
            {
                title: 'Improve Team Productivity',
                description: 'Implement new tools and processes to boost team efficiency by 30%',
                quarter: 1,
                year: 2026,
                status: 'in_progress',
                progress: 45
            },
            {
                title: 'Expand Customer Base',
                description: 'Acquire 500 new customers through marketing campaigns',
                quarter: 2,
                year: 2026,
                status: 'pending',
                progress: 0
            }
        ];

        const goalIds = [];
        for (const goal of goals) {
            const result = await client.query(
                `INSERT INTO quarterly_goals (user_id, title, description, quarter, year, status, progress)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
                [userId, goal.title, goal.description, goal.quarter, goal.year, goal.status, goal.progress]
            );
            goalIds.push(result.rows[0].id);
            console.log(`  ✅ Created goal: ${goal.title}`);
        }

        // 3. Create monthly plans
        console.log('📅 Creating monthly plans...');
        const plans = [
            {
                goalId: goalIds[0],
                title: 'UI/UX Redesign',
                description: 'Complete new design system and user interface',
                month: 2,
                year: 2026,
                status: 'completed',
                progress: 100
            },
            {
                goalId: goalIds[0],
                title: 'Backend API Development',
                description: 'Build new REST API endpoints and database schema',
                month: 3,
                year: 2026,
                status: 'in_progress',
                progress: 70
            },
            {
                goalId: goalIds[1],
                title: 'Implement Project Management Tool',
                description: 'Set up and train team on new PM software',
                month: 2,
                year: 2026,
                status: 'in_progress',
                progress: 60
            },
            {
                goalId: goalIds[1],
                title: 'Automate Deployment Pipeline',
                description: 'Set up CI/CD for faster deployments',
                month: 3,
                year: 2026,
                status: 'pending',
                progress: 20
            }
        ];

        const planIds = [];
        for (const plan of plans) {
            const result = await client.query(
                `INSERT INTO monthly_plans (user_id, quarterly_goal_id, title, description, month, year, status, progress)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
                [userId, plan.goalId, plan.title, plan.description, plan.month, plan.year, plan.status, plan.progress]
            );
            planIds.push(result.rows[0].id);
            console.log(`  ✅ Created plan: ${plan.title}`);
        }

        // 4. Create weekly tasks
        console.log('✅ Creating weekly tasks...');
        const tasks = [
            {
                planId: planIds[1],
                title: 'Design database schema',
                description: 'Create ERD and define all tables and relationships',
                weekNumber: 10,
                priority: 'high',
                status: 'completed',
                estimatedHours: 8,
                actualHours: 10,
                dueDate: '2026-03-07',
                isUrgent: false
            },
            {
                planId: planIds[1],
                title: 'Implement authentication endpoints',
                description: 'Build login, register, and JWT token management',
                weekNumber: 11,
                priority: 'high',
                status: 'completed',
                estimatedHours: 12,
                actualHours: 14,
                dueDate: '2026-03-14',
                isUrgent: false
            },
            {
                planId: planIds[1],
                title: 'Create CRUD endpoints for goals',
                description: 'Build API endpoints for quarterly goals management',
                weekNumber: 12,
                priority: 'medium',
                status: 'in_progress',
                estimatedHours: 10,
                actualHours: 6,
                dueDate: '2026-03-21',
                isUrgent: true
            },
            {
                planId: planIds[1],
                title: 'Write API documentation',
                description: 'Document all endpoints with examples',
                weekNumber: 13,
                priority: 'medium',
                status: 'pending',
                estimatedHours: 6,
                actualHours: 0,
                dueDate: '2026-03-28',
                isUrgent: false
            },
            {
                planId: planIds[2],
                title: 'Research PM tools',
                description: 'Evaluate top 5 project management tools',
                weekNumber: 9,
                priority: 'high',
                status: 'completed',
                estimatedHours: 4,
                actualHours: 5,
                dueDate: '2026-02-28',
                isUrgent: false
            },
            {
                planId: planIds[2],
                title: 'Set up team workspace',
                description: 'Configure boards, workflows, and permissions',
                weekNumber: 10,
                priority: 'high',
                status: 'completed',
                estimatedHours: 6,
                actualHours: 7,
                dueDate: '2026-03-07',
                isUrgent: false
            },
            {
                planId: planIds[2],
                title: 'Train team members',
                description: 'Conduct training sessions for all team members',
                weekNumber: 11,
                priority: 'medium',
                status: 'in_progress',
                estimatedHours: 8,
                actualHours: 4,
                dueDate: '2026-03-14',
                isUrgent: false
            },
            {
                planId: planIds[3],
                title: 'Set up GitHub Actions',
                description: 'Configure CI/CD pipeline with automated tests',
                weekNumber: 12,
                priority: 'high',
                status: 'pending',
                estimatedHours: 10,
                actualHours: 0,
                dueDate: '2026-03-21',
                isUrgent: false
            }
        ];

        const taskIds = [];
        for (const task of tasks) {
            const result = await client.query(
                `INSERT INTO weekly_tasks (user_id, monthly_plan_id, title, description, week_number, year, priority, status, estimated_hours, actual_hours, due_date, is_urgent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
                [userId, task.planId, task.title, task.description, task.weekNumber, 2026, task.priority, task.status, task.estimatedHours, task.actualHours, task.dueDate, task.isUrgent]
            );
            taskIds.push(result.rows[0].id);
            console.log(`  ✅ Created task: ${task.title}`);
        }

        // 5. Create time logs
        console.log('⏱️  Creating time logs...');
        const timeLogs = [
            { taskId: taskIds[0], hours: 5, date: '2026-03-05', notes: 'Initial schema design' },
            { taskId: taskIds[0], hours: 5, date: '2026-03-06', notes: 'Refinement and review' },
            { taskId: taskIds[1], hours: 8, date: '2026-03-11', notes: 'JWT implementation' },
            { taskId: taskIds[1], hours: 6, date: '2026-03-12', notes: 'Testing and bug fixes' },
            { taskId: taskIds[2], hours: 6, date: '2026-03-18', notes: 'CRUD endpoints development' },
            { taskId: taskIds[4], hours: 5, date: '2026-02-26', notes: 'Tool comparison research' },
            { taskId: taskIds[5], hours: 7, date: '2026-03-05', notes: 'Workspace configuration' },
            { taskId: taskIds[6], hours: 4, date: '2026-03-13', notes: 'First training session' }
        ];

        for (const log of timeLogs) {
            await client.query(
                `INSERT INTO time_logs (task_id, user_id, hours, date, notes)
         VALUES ($1, $2, $3, $4, $5)`,
                [log.taskId, userId, log.hours, log.date, log.notes]
            );
            console.log(`  ✅ Created time log: ${log.hours}h on ${log.date}`);
        }

        // 6. Create notifications
        console.log('🔔 Creating notifications...');
        const notifications = [
            {
                type: 'reminder',
                title: 'Task Due Soon',
                message: 'Task "Create CRUD endpoints for goals" is due in 3 days',
                isRead: false
            },
            {
                type: 'overdue',
                title: 'Overdue Task',
                message: 'Task "Write API documentation" is overdue by 2 days',
                isRead: false
            },
            {
                type: 'general',
                title: 'Welcome!',
                message: 'Welcome to Team Goal Tracker! Start by creating your first quarterly goal.',
                isRead: true
            }
        ];

        for (const notif of notifications) {
            await client.query(
                `INSERT INTO notifications (user_id, type, title, message, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
                [userId, notif.type, notif.title, notif.message, notif.isRead]
            );
            console.log(`  ✅ Created notification: ${notif.title}`);
        }

        await client.query('COMMIT');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Demo Account Credentials:');
        console.log('   Email: demo@example.com');
        console.log('   Password: demo123');
        console.log('\n🌐 Login at: https://tackstracker.vercel.app');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seed script
seedDatabase()
    .then(() => {
        console.log('✅ Seeding process finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
