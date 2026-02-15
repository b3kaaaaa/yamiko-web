
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function simulateScraping(sourceId: string, url: string, options: any) {
    try {
        console.log(`Starting simulated scrape for ${url}...`);

        // 1. Create a Job
        const { data: job, error: jobError } = await supabase
            .from('scraper_jobs')
            .insert({
                source_id: sourceId,
                manga_title: 'Detecting...',
                manga_url: url,
                type: 'full_sync',
                status: 'processing',
                progress: 0
            })
            .select()
            .single();

        if (jobError) throw jobError;

        // Log start
        await supabase.from('scraper_logs').insert({
            job_id: job.id,
            source_id: sourceId,
            level: 'info',
            message: `Started scraping job for ${url}`
        });

        // Simulate delay & progress
        await new Promise(r => setTimeout(r, 2000));
        await supabase.from('scraper_jobs').update({ progress: 25, manga_title: 'Solo Leveling (Simulated)' }).eq('id', job.id);

        // 2. Create Manga Entry (Simulated)
        // In real app, we fetch OG tags here.
        const mangaTitle = 'Solo Leveling (Simulated Source)';
        const { data: manga, error: mangaError } = await supabase
            .from('manga')
            .insert({
                title: mangaTitle,
                description: 'Simulated description extracted from the source URL.',
                cover_url: 'https://m.media-amazon.com/images/M/MV5BMzY5ZGU4MGItZTk2Ny00MTE2LWI5MzUtYmZhYWQ5NTgyODQxXkEyXkFqcGc@._V1_.jpg', // Mock image
                status: 'ONGOING',
                author: 'Chu-Gong',
                artist: 'Redice Studio',
                release_year: 2024,
                rating: 4.8,
                views: 0
            })
            .select()
            .single();

        if (mangaError) {
            await supabase.from('scraper_logs').insert({
                job_id: job.id,
                level: 'error',
                message: `Failed to insert manga: ${mangaError.message}`
            });
            await supabase.from('scraper_jobs').update({ status: 'failed', error_message: mangaError.message }).eq('id', job.id);
            return;
        }

        // Log success
        await supabase.from('scraper_logs').insert({
            job_id: job.id,
            source_id: sourceId,
            level: 'success',
            message: `Successfully parsed metadata for "${mangaTitle}"`
        });

        await supabase.from('scraper_jobs').update({ progress: 50 }).eq('id', job.id);
        await new Promise(r => setTimeout(r, 1500));

        // 3. Create Chapters (Simulated)
        if (options.chapters) {
            const chapters = [];
            for (let i = 1; i <= 5; i++) {
                chapters.push({
                    manga_id: manga.id,
                    title: `Chapter ${i}`,
                    chapter_number: i,
                    pages: [], // Empty pages for now
                    views: 0
                });
            }
            const { error: chapterError } = await supabase.from('chapters').insert(chapters);

            if (chapterError) throw chapterError;

            await supabase.from('scraper_logs').insert({
                job_id: job.id,
                source_id: sourceId,
                level: 'info',
                message: `Found and added 5 new chapters.`
            });
        }

        // Complete Job
        await supabase.from('scraper_jobs').update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            result_summary: 'Created new manga + 5 chapters'
        }).eq('id', job.id);

    } catch (error: any) {
        console.error('Simulation failed:', error);
        await supabase.from('scraper_logs').insert({
            source_id: sourceId,
            level: 'error',
            message: `Unexpected error during simulation: ${error.message}`
        });
    }
}
