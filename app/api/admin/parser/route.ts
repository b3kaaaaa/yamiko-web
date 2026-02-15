import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Fetch all sources
        const { data: sources, error: sourcesError } = await supabase
            .from('scraper_sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (sourcesError) throw sourcesError;

        // Fetch recent jobs (limit 10)
        const { data: jobs, error: jobsError } = await supabase
            .from('scraper_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (jobsError) throw jobsError;

        // Fetch recent logs (limit 20)
        const { data: logs, error: logsError } = await supabase
            .from('scraper_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (logsError) throw logsError;

        return NextResponse.json({
            sources: sources || [],
            jobs: jobs || [],
            logs: logs || []
        });

    } catch (error: any) {
        console.error('Error fetching parser data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch parser data', details: error.message },
            { status: 500 }
        );
    }
}
