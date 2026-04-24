const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyFix() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, 'migrations', 'fix_storage_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying storage RLS fix...');
        await client.query(sql);
        console.log('✅ Storage RLS fix applied successfully!');
    } catch (err) {
        console.error('❌ Failed to apply fix:', err.message);
    } finally {
        await client.end();
    }
}

applyFix();
