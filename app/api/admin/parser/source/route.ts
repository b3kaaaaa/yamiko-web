import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runScraper } from '@/app/lib/scraper-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const { url, options } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Create Source
        const { data: source, error } = await supabase
            .from('scraper_sources')
            .insert({
                name: new URL(url).hostname, // Simple name extraction
                url: url,
                status: 'active',
                last_sync: new Date().toISOString(),
                config: options || {}
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Trigger Real Scraper (Fire and forget, don't await)
        runScraper(source.id, url, options).catch(console.error);

        return NextResponse.json({ source });

    } catch (error: any) {
        console.error('Error adding source:', error);
        return NextResponse.json(
            { error: 'Failed to add source', details: error.message },
            { status: 500 }
        );
    }
}
