const Groq = require('groq-sdk');

class GroqService {
    constructor() {
        this.client = null;
        this.isEnabled = process.env.AI_ENABLED === 'true';

        if (this.isEnabled && process.env.GROQ_API_KEY) {
            this.client = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
            console.log('✅ Groq AI service initialized');
        } else {
            console.log('ℹ️  AI features disabled (set AI_ENABLED=true and GROQ_API_KEY)');
        }
    }

    async query(userMessage, systemPrompt = '', tools = []) {
        if (!this.isEnabled || !this.client) {
            return { error: 'AI features are not enabled' };
        }

        try {
            const messages = [];

            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            messages.push({
                role: 'user',
                content: userMessage
            });

            const response = await this.client.chat.completions.create({
                model: 'llama-3.1-8b-instant', // Free, fast model
                messages: messages,
                temperature: 0.3,
                max_tokens: 1024,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: tools.length > 0 ? 'auto' : undefined
            });

            return {
                success: true,
                content: response.choices[0].message.content,
                toolCalls: response.choices[0].message.tool_calls || [],
                usage: response.usage
            };
        } catch (error) {
            console.error('Groq API error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async processNaturalLanguageQuery(query, userId, userRole, userDept) {
        const systemPrompt = `You are an AI assistant for a Team Goal Tracker application.
Current user: ID ${userId}, Role: ${userRole}, Department: ${userDept}

You help users manage their quarterly goals, monthly plans, and weekly tasks.
Parse the user's query and determine what action they want to take.

Available actions:
- get_my_tasks: Get tasks assigned to current user
- get_team_tasks: Get all tasks in user's department (leads/admins only)
- get_overdue_tasks: Get overdue tasks
- get_task_by_id: Get specific task details
- create_task: Create a new task (leads/admins only)
- update_task: Update task status or details
- get_dashboard_stats: Get dashboard statistics
- get_team_performance: Get team performance metrics

Respond with a clear, friendly answer and indicate which action to take.`;

        const tools = [
            {
                type: 'function',
                function: {
                    name: 'get_my_tasks',
                    description: 'Get tasks assigned to the current user',
                    parameters: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                enum: ['all', 'pending', 'in_progress', 'completed', 'review'],
                                description: 'Filter by task status'
                            }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'get_overdue_tasks',
                    description: 'Get all overdue tasks',
                    parameters: {
                        type: 'object',
                        properties: {
                            user_id: {
                                type: 'string',
                                description: 'User ID to filter by (optional)'
                            }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'get_dashboard_stats',
                    description: 'Get dashboard statistics and metrics',
                    parameters: {
                        type: 'object',
                        properties: {}
                    }
                }
            }
        ];

        return await this.query(query, systemPrompt, tools);
    }

    async generateSmartNotification(taskData) {
        const prompt = `Generate a friendly, motivating notification message for this task:
Title: ${taskData.title}
Status: ${taskData.status}
Progress: ${taskData.progress}%
Due Date: ${taskData.due_date}
Assigned To: ${taskData.assigned_to_name}

Make it personal, encouraging, and actionable. Keep it under 100 characters.`;

        const response = await this.query(prompt);
        return response.success ? response.content : `Task update: ${taskData.title}`;
    }

    async analyzeMeetingNotes(notes) {
        const prompt = `Extract tasks from these meeting notes. For each task, identify:
- Task title
- Assignee (person's name)
- Due date (if mentioned)
- Priority (high/medium/low)

Meeting notes:
${notes}

Return as JSON array: [{ title: "", assignee: "", due_date: "", priority: "" }]`;

        const response = await this.query(prompt);

        if (response.success) {
            try {
                // Try to parse JSON from response
                const jsonMatch = response.content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.error('Failed to parse task extraction:', e);
            }
        }

        return [];
    }

    async generateWeeklyInsights(userData) {
        const prompt = `Generate a brief weekly performance insight for this user:
Tasks Completed: ${userData.completed}
Tasks In Progress: ${userData.in_progress}
Tasks Overdue: ${userData.overdue}
Average Completion Time: ${userData.avg_completion_time} days
On-Time Rate: ${userData.on_time_rate}%

Provide:
1. A one-sentence summary
2. One positive highlight
3. One actionable recommendation

Keep it encouraging and specific.`;

        const response = await this.query(prompt);
        return response.success ? response.content : 'Keep up the great work!';
    }
}

module.exports = new GroqService();
