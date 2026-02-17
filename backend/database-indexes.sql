-- ============================================
-- DATABASE PERFORMANCE INDEXES
-- ============================================
-- Run these commands in your Neon database console
-- to dramatically improve query performance

-- Critical indexes for performance
-- Index for quarterly goals queries by user, year, and quarter
CREATE INDEX IF NOT EXISTS idx_goals_user_year_quarter 
  ON quarterly_goals(user_id, year, quarter);

-- Index for monthly plans queries by user, year, and month
CREATE INDEX IF NOT EXISTS idx_plans_user_year_month 
  ON monthly_plans(user_id, year, month);

-- Index for weekly tasks queries by user and status
CREATE INDEX IF NOT EXISTS idx_tasks_user_status 
  ON weekly_tasks(user_id, status);

-- Index for finding overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON weekly_tasks(due_date) 
  WHERE status != 'completed';

-- Index for notifications queries by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read, created_at);

-- Index for time logs queries
CREATE INDEX IF NOT EXISTS idx_time_logs_user_task 
  ON time_logs(user_id, task_id, date);

-- Index for user lookups by email (for login)
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- ============================================
-- VERIFY INDEXES
-- ============================================
-- Check that indexes were created successfully
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('quarterly_goals', 'monthly_plans', 'weekly_tasks', 'notifications', 'time_logs', 'users')
ORDER BY tablename, indexname;
