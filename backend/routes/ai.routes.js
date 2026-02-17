const express = require('express');
const router = express.Router();
const groqService = require('../services/ai/groqService');
const smartFeatures = require('../services/ai/smartFeatures');
const { aiRateLimiter, aiExpensiveRateLimiter } = require('../middleware/aiRateLimit');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// All AI routes require authentication
router.use(authenticateToken);

/**
 * POST /api/ai/query
 * Natural language query endpoint
 */
router.post('/query', aiRateLimiter, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }

        const result = await groqService.processNaturalLanguageQuery(
            query,
            req.user.id,
            req.user.role,
            req.user.dept
        );

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        // If AI suggested tool calls, execute them
        if (result.toolCalls && result.toolCalls.length > 0) {
            const toolResults = await executeToolCalls(result.toolCalls, req.user);
            return res.json({
                answer: result.content,
                data: toolResults,
                usage: result.usage
            });
        }

        res.json({
            answer: result.content,
            usage: result.usage
        });
    } catch (error) {
        console.error('AI query error:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

/**
 * GET /api/ai/suggestions
 * Get smart suggestions for task assignment
 */
router.get('/suggestions', aiRateLimiter, async (req, res) => {
    try {
        const { context, task_id } = req.query;

        if (context === 'task_assignment' && task_id) {
            // Get task details
            const task = await db.query(
                'SELECT * FROM weekly_tasks WHERE id = $1',
                [task_id]
            );

            if (task.rows.length === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Get team members in same department
            const teamMembers = await db.query(
                'SELECT id, name, email, role FROM users WHERE dept = $1 AND status = $2 AND role IN ($3, $4)',
                [req.user.dept, 'active', 'employee', 'intern']
            );

            // Get all active tasks
            const activeTasks = await db.query(
                'SELECT * FROM weekly_tasks WHERE status IN ($1, $2)',
                ['pending', 'in_progress']
            );

            // Use smart features to suggest best assignee
            const suggestion = await smartFeatures.suggestAssignee(
                task.rows[0],
                teamMembers.rows,
                activeTasks.rows
            );

            return res.json({
                suggestion: {
                    member: {
                        id: suggestion.member.id,
                        name: suggestion.member.name
                    },
                    score: suggestion.score,
                    reasoning: suggestion.reasoning,
                    activeTasks: suggestion.activeTasks
                }
            });
        }

        res.status(400).json({ error: 'Invalid context or missing parameters' });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

/**
 * POST /api/ai/generate-tasks
 * Convert meeting notes or text into tasks
 */
router.post('/generate-tasks', aiExpensiveRateLimiter, async (req, res) => {
    try {
        const { notes, goal_id } = req.body;

        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const tasks = await groqService.analyzeMeetingNotes(notes);

        res.json({
            tasks,
            count: tasks.length,
            goal_id
        });
    } catch (error) {
        console.error('Task generation error:', error);
        res.status(500).json({ error: 'Failed to generate tasks' });
    }
});

/**
 * GET /api/ai/insights
 * Get AI-generated insights for user or team
 */
router.get('/insights', aiRateLimiter, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const userId = req.user.id;

        // Get user's task data
        const completedTasks = await db.query(
            `SELECT COUNT(*) as count FROM weekly_tasks 
       WHERE assigned_to = $1 AND status = $2 
       AND updated_at >= NOW() - INTERVAL '1 ${period}'`,
            [userId, 'completed']
        );

        const inProgressTasks = await db.query(
            'SELECT COUNT(*) as count FROM weekly_tasks WHERE assigned_to = $1 AND status = $2',
            [userId, 'in_progress']
        );

        const overdueTasks = await db.query(
            'SELECT COUNT(*) as count FROM weekly_tasks WHERE assigned_to = $1 AND due_date < NOW() AND status != $2',
            [userId, 'completed']
        );

        // Calculate average completion time
        const avgCompletion = await db.query(
            `SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
       FROM weekly_tasks 
       WHERE assigned_to = $1 AND status = $2
       AND updated_at >= NOW() - INTERVAL '1 ${period}'`,
            [userId, 'completed']
        );

        const userData = {
            completed: parseInt(completedTasks.rows[0].count),
            in_progress: parseInt(inProgressTasks.rows[0].count),
            overdue: parseInt(overdueTasks.rows[0].count),
            avg_completion_time: parseFloat(avgCompletion.rows[0].avg_days || 0).toFixed(1),
            on_time_rate: 85 // TODO: Calculate actual on-time rate
        };

        // Generate AI insights
        const insights = await groqService.generateWeeklyInsights(userData);

        res.json({
            period,
            metrics: userData,
            insights,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

/**
 * GET /api/ai/risks
 * Detect risks across tasks (rule-based, no AI cost)
 */
router.get('/risks', async (req, res) => {
    try {
        let query = 'SELECT * FROM weekly_tasks WHERE status IN ($1, $2)';
        const params = ['pending', 'in_progress'];

        // If not admin, only show user's tasks or department tasks for leads
        if (req.user.role === 'employee' || req.user.role === 'intern') {
            query += ' AND assigned_to = $3';
            params.push(req.user.id);
        } else if (req.user.role === 'lead') {
            query += ' AND dept = $3';
            params.push(req.user.dept);
        }

        const tasks = await db.query(query, params);
        const risks = smartFeatures.detectRisks(tasks.rows);

        res.json({
            risks,
            count: risks.length,
            high_severity: risks.filter(r => r.severity === 'high').length,
            medium_severity: risks.filter(r => r.severity === 'medium').length
        });
    } catch (error) {
        console.error('Risk detection error:', error);
        res.status(500).json({ error: 'Failed to detect risks' });
    }
});

/**
 * GET /api/ai/predictions
 * Predict completion for goals/tasks (rule-based, no AI cost)
 */
router.get('/predictions/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let item;

        if (type === 'goal') {
            const result = await db.query('SELECT * FROM quarterly_goals WHERE id = $1', [id]);
            item = result.rows[0];
        } else if (type === 'task') {
            const result = await db.query('SELECT * FROM weekly_tasks WHERE id = $1', [id]);
            item = result.rows[0];
        } else {
            return res.status(400).json({ error: 'Invalid type. Use "goal" or "task"' });
        }

        if (!item) {
            return res.status(404).json({ error: `${type} not found` });
        }

        const prediction = smartFeatures.predictCompletion(item);

        res.json({
            type,
            id,
            prediction
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to generate prediction' });
    }
});

/**
 * Helper function to execute tool calls from AI
 */
async function executeToolCalls(toolCalls, user) {
    const results = [];

    for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        try {
            let result;

            switch (functionName) {
                case 'get_my_tasks':
                    const status = args.status || 'all';
                    let query = 'SELECT * FROM weekly_tasks WHERE assigned_to = $1';
                    const params = [user.id];

                    if (status !== 'all') {
                        query += ' AND status = $2';
                        params.push(status);
                    }

                    const tasks = await db.query(query, params);
                    result = tasks.rows;
                    break;

                case 'get_overdue_tasks':
                    const overdueQuery = `
            SELECT * FROM weekly_tasks 
            WHERE due_date < NOW() 
            AND status != 'completed'
            ${args.user_id ? 'AND assigned_to = $1' : ''}
          `;
                    const overdueParams = args.user_id ? [args.user_id] : [];
                    const overdue = await db.query(overdueQuery, overdueParams);
                    result = overdue.rows;
                    break;

                case 'get_dashboard_stats':
                    // Get basic stats
                    const stats = await db.query(
                        `SELECT 
              COUNT(*) FILTER (WHERE status = 'completed') as completed,
              COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
              COUNT(*) FILTER (WHERE status = 'pending') as pending,
              COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue
             FROM weekly_tasks 
             WHERE assigned_to = $1`,
                        [user.id]
                    );
                    result = stats.rows[0];
                    break;

                default:
                    result = { error: `Unknown function: ${functionName}` };
            }

            results.push({
                function: functionName,
                result
            });
        } catch (error) {
            results.push({
                function: functionName,
                error: error.message
            });
        }
    }

    return results;
}

module.exports = router;
