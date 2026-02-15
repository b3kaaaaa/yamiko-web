// Test Supabase Connection Endpoint
// GET /api/test-supabase

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // Test connection by counting records
        const [
            { count: userCount },
            { count: mangaCount },
            { count: chapterCount },
            { count: guildCount },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('manga').select('*', { count: 'exact', head: true }),
            supabase.from('chapters').select('*', { count: 'exact', head: true }),
            supabase.from('guilds').select('*', { count: 'exact', head: true }),
        ]);

        // Get sample user (if exists)
        const { data: sampleUser } = await supabase
            .from('profiles')
            .select('id, username, level, exp, rubies, energy, role')
            .limit(1)
            .single();

        return NextResponse.json({
            success: true,
            message: 'Supabase connection successful! ✅',
            database: {
                connected: true,
                provider: 'Supabase',
                counts: {
                    users: userCount || 0,
                    manga: mangaCount || 0,
                    chapters: chapterCount || 0,
                    guilds: guildCount || 0,
                },
            },
            sampleUser: sampleUser || 'No users in database yet',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Supabase connection error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Supabase connection failed! ❌',
                error: error.message,
                hint: 'Make sure Supabase environment variables are set correctly in .env',
            },
            { status: 500 }
        );
    }
}
