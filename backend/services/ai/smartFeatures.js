// Smart features using rule-based algorithms (no AI API calls)

class SmartFeaturesService {
    /**
     * Suggest best team member for task assignment
     * Based on: current workload, skill match, availability
     */
    async suggestAssignee(taskData, teamMembers, existingTasks) {
        const scores = teamMembers.map(member => {
            let score = 100;

            // Count active tasks for this member
            const memberTasks = existingTasks.filter(
                t => t.assigned_to === member.id &&
                    ['pending', 'in_progress'].includes(t.status)
            );

            // Penalize based on workload (fewer tasks = higher score)
            score -= memberTasks.length * 15;

            // Check if member has overdue tasks (big penalty)
            const overdueCount = memberTasks.filter(
                t => new Date(t.due_date) < new Date()
            ).length;
            score -= overdueCount * 25;

            // Bonus for skill match (if task has tags)
            if (taskData.tags && member.skills) {
                const matchingSkills = taskData.tags.filter(
                    tag => member.skills.includes(tag)
                );
                score += matchingSkills.length * 20;
            }

            // Bonus for availability (check due dates of current tasks)
            const upcomingDeadlines = memberTasks.filter(
                t => {
                    const daysUntilDue = Math.ceil(
                        (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilDue <= 3;
                }
            ).length;
            score -= upcomingDeadlines * 10;

            return {
                member,
                score: Math.max(0, score),
                activeTasks: memberTasks.length,
                overdueCount,
                reasoning: this.generateReasoning(member, memberTasks.length, overdueCount, score)
            };
        });

        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        return scores[0]; // Return best match
    }

    generateReasoning(member, taskCount, overdueCount, score) {
        const reasons = [];

        if (taskCount === 0) {
            reasons.push('no active tasks');
        } else if (taskCount <= 2) {
            reasons.push(`only ${taskCount} active task${taskCount > 1 ? 's' : ''}`);
        } else {
            reasons.push(`${taskCount} active tasks`);
        }

        if (overdueCount > 0) {
            reasons.push(`${overdueCount} overdue`);
        }

        if (score >= 80) {
            return `${member.name} - Best fit: ${reasons.join(', ')}`;
        } else if (score >= 50) {
            return `${member.name} - Good fit: ${reasons.join(', ')}`;
        } else {
            return `${member.name} - Available but busy: ${reasons.join(', ')}`;
        }
    }

    /**
     * Predict if goal/task will complete on time
     */
    predictCompletion(item) {
        const now = new Date();
        const startDate = new Date(item.created_at);
        const dueDate = new Date(item.due_date);

        const totalDays = Math.ceil((dueDate - startDate) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        const expectedProgress = (daysElapsed / totalDays) * 100;
        const actualProgress = item.progress || 0;
        const progressDelta = actualProgress - expectedProgress;

        let status, confidence, recommendation;

        if (daysRemaining < 0) {
            status = 'overdue';
            confidence = 100;
            recommendation = 'Immediate action required';
        } else if (progressDelta >= 10) {
            status = 'ahead_of_schedule';
            confidence = 90;
            recommendation = 'On track, maintain momentum';
        } else if (progressDelta >= -10) {
            status = 'on_track';
            confidence = 80;
            recommendation = 'Progressing well';
        } else if (progressDelta >= -25) {
            status = 'at_risk';
            confidence = 70;
            recommendation = 'May need additional resources';
        } else {
            status = 'behind_schedule';
            confidence = 85;
            recommendation = 'Requires immediate attention';
        }

        return {
            status,
            confidence,
            recommendation,
            metrics: {
                expectedProgress: Math.round(expectedProgress),
                actualProgress: Math.round(actualProgress),
                progressDelta: Math.round(progressDelta),
                daysRemaining
            }
        };
    }

    /**
     * Detect deadline risks across tasks
     */
    detectRisks(tasks) {
        const risks = [];

        tasks.forEach(task => {
            const riskScore = this.calculateRiskScore(task);

            if (riskScore >= 7) {
                risks.push({
                    task,
                    riskScore,
                    severity: 'high',
                    reasons: this.getRiskReasons(task, riskScore)
                });
            } else if (riskScore >= 4) {
                risks.push({
                    task,
                    riskScore,
                    severity: 'medium',
                    reasons: this.getRiskReasons(task, riskScore)
                });
            }
        });

        return risks.sort((a, b) => b.riskScore - a.riskScore);
    }

    calculateRiskScore(task) {
        let score = 0;
        const now = new Date();
        const dueDate = new Date(task.due_date);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Already overdue
        if (daysUntilDue < 0) {
            score += 5;
        }

        // Due very soon with low progress
        if (daysUntilDue <= 1 && task.progress < 80) {
            score += 4;
        } else if (daysUntilDue <= 3 && task.progress < 50) {
            score += 3;
        }

        // High priority task with low progress
        if (task.priority === 'high' && task.progress < 30) {
            score += 2;
        }

        // Task has dependencies that are incomplete
        if (task.depends_on && task.depends_on.length > 0) {
            score += 1;
        }

        // Estimated hours vs days remaining
        if (task.estimated_hours && daysUntilDue > 0) {
            const hoursPerDay = 6; // Assume 6 productive hours per day
            const requiredDays = task.estimated_hours / hoursPerDay;
            if (requiredDays > daysUntilDue) {
                score += 2;
            }
        }

        return Math.min(10, score);
    }

    getRiskReasons(task, score) {
        const reasons = [];
        const now = new Date();
        const dueDate = new Date(task.due_date);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            reasons.push(`Overdue by ${Math.abs(daysUntilDue)} day(s)`);
        } else if (daysUntilDue <= 1) {
            reasons.push(`Due in ${daysUntilDue} day(s)`);
        }

        if (task.progress < 50 && daysUntilDue <= 3) {
            reasons.push(`Only ${task.progress}% complete`);
        }

        if (task.priority === 'high') {
            reasons.push('High priority');
        }

        if (task.depends_on && task.depends_on.length > 0) {
            reasons.push('Has dependencies');
        }

        return reasons;
    }

    /**
     * Balance workload across team
     */
    suggestWorkloadBalancing(teamMembers, tasks) {
        const workload = teamMembers.map(member => {
            const memberTasks = tasks.filter(
                t => t.assigned_to === member.id &&
                    ['pending', 'in_progress'].includes(t.status)
            );

            return {
                member,
                taskCount: memberTasks.length,
                tasks: memberTasks
            };
        });

        workload.sort((a, b) => b.taskCount - a.taskCount);

        const maxLoad = workload[0].taskCount;
        const minLoad = workload[workload.length - 1].taskCount;

        if (maxLoad - minLoad >= 3) {
            return {
                needsBalancing: true,
                overloaded: workload[0],
                underutilized: workload[workload.length - 1],
                suggestion: `Consider reassigning tasks from ${workload[0].member.name} (${maxLoad} tasks) to ${workload[workload.length - 1].member.name} (${minLoad} tasks)`
            };
        }

        return {
            needsBalancing: false,
            message: 'Workload is balanced across team'
        };
    }
}

module.exports = new SmartFeaturesService();
