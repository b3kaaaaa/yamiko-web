const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function runMigration() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../supabase/parser_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
