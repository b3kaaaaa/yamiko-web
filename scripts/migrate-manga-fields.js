// Migration: Add new columns to manga table via Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    console.log('🚀 Running manga table migration via Supabase...\n');

    // Execute raw SQL via Supabase's rpc
    const sql = `
        ALTER TABLE manga
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MANHWA',
            ADD COLUMN IF NOT EXISTS age_rating TEXT DEFAULT '16+',
            ADD COLUMN IF NOT EXISTS publisher TEXT,
            ADD COLUMN IF NOT EXISTS studio TEXT,
            ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KR',
            ADD COLUMN IF NOT EXISTS fandom_url TEXT,
            ADD COLUMN IF NOT EXISTS forum_url TEXT,
            ADD COLUMN IF NOT EXISTS alt_titles TEXT,
            ADD COLUMN IF NOT EXISTS translation_status TEXT DEFAULT 'ONGOING';
    `;

    // Try using the Supabase SQL endpoint directly via fetch
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(`${url}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });

    // The rpc approach won't work for DDL. Let's try the management API approach
    // Actually, the simplest way is via pg directly or supabase sql editor
    // Let's try a workaround: create a temporary function and call it

    // Alternative: Use the Supabase SQL HTTP endpoint (v2 management API)
    const sqlResponse = await fetch(`${url}/pg/query`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });

    if (sqlResponse.ok) {
        const result = await sqlResponse.json();
        console.log('✅ Migration successful!', result);
    } else {
        console.log('⚠️  Direct SQL endpoint might not be available.');
        console.log('Status:', sqlResponse.status);
        const text = await sqlResponse.text();
        console.log('Response:', text);

        console.log('\n📋 Please run this SQL manually in the Supabase SQL Editor:');
        console.log(sql);

        console.log('\n🔄 Attempting alternative: updating an existing record to test column access...');

        // Just try to update with new columns - if they don't exist, Supabase will error
        const { data, error } = await supabase
            .from('manga')
            .select('id, type, age_rating, publisher, studio, country, fandom_url, forum_url, alt_titles, translation_status')
            .limit(1);

        if (error) {
            console.log('❌ Columns do NOT exist yet. Error:', error.message);
            console.log('\n‼️  You MUST run the SQL above in your Supabase Dashboard → SQL Editor');
        } else {
            console.log('✅ All columns already exist!', data);
        }
    }
}

migrate().catch(console.error);
