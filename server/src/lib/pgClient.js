const { Pool } = require('pg');

// Use Supabase Supavisor pooler (Transaction mode) via IPv4
// Parse credentials from DATABASE_URL or use explicit config
let poolConfig;

try {
    const dbUrl = process.env.DATABASE_URL || '';
    // Expected: postgres://postgres.REF:PASS@HOST:PORT/postgres
    const url = new URL(dbUrl);
    poolConfig = {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host: url.hostname,
        port: parseInt(url.port) || 6543,
        database: url.pathname.replace('/', ''),
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
    };
} catch (e) {
    // Fallback to hardcoded Supabase transaction pooler
    poolConfig = {
        user: 'postgres.zgknwsrfpqjncvyzfiww',
        password: 'Ravita@441977',
        host: 'aws-0-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
    };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('PG pool error:', err.message);
});

module.exports = pool;
