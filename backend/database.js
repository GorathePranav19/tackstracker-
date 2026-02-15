const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quarterly Goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quarterly_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        quarter INTEGER NOT NULL CHECK(quarter BETWEEN 1 AND 4),
        year INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Monthly Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quarterly_goal_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
        year INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (quarterly_goal_id) REFERENCES quarterly_goals(id) ON DELETE SET NULL
      )
    `);

    // Weekly Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        monthly_plan_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 53),
        year INTEGER NOT NULL,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        estimated_hours REAL DEFAULT 0,
        actual_hours REAL DEFAULT 0,
        due_date DATE,
        is_urgent BOOLEAN DEFAULT false,
        depends_on INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (monthly_plan_id) REFERENCES monthly_plans(id) ON DELETE SET NULL,
        FOREIGN KEY (depends_on) REFERENCES weekly_tasks(id) ON DELETE SET NULL
      )
    `);

    // Time Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_logs (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        hours REAL NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('reminder', 'overdue', 'dependency', 'general')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Initialize database on startup
initializeDatabase().catch(console.error);

// Helper function to convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Helper function to run queries with promises
async function runQuery(sql, params = []) {
  let pgSql = convertPlaceholders(sql);

  // Add RETURNING id for INSERT statements if not already present
  if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql = pgSql + ' RETURNING id';
  }

  const result = await pool.query(pgSql, params);
  return {
    id: result.rows[0]?.id,
    changes: result.rowCount
  };
}

// Helper function to get single row
async function getOne(sql, params = []) {
  const pgSql = convertPlaceholders(sql);
  const result = await pool.query(pgSql, params);
  return result.rows[0];
}

// Helper function to get all rows
async function getAll(sql, params = []) {
  const pgSql = convertPlaceholders(sql);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

module.exports = {
  pool,
  runQuery,
  getOne,
  getAll
};

