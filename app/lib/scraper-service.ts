
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function runScraper(sourceId: string, url: string, options: any) {
    try {
        console.log(`Starting REAL scraping job for ${url}...`);

        // 1. Create a Job
        const { data: job, error: jobError } = await supabase
            .from('scraper_jobs')
            .insert({
                source_id: sourceId,
                manga_title: 'Fetching...',
                manga_url: url,
                type: 'full_sync',
                status: 'processing',
                progress: 10
            })
            .select()
            .single();

        if (jobError) throw jobError;

        await supabase.from('scraper_logs').insert({
            job_id: job.id,
            source_id: sourceId,
            level: 'info',
            message: `Starting HTTP request to ${url}`
        });

        // 2. Fetch HTML
        // User-Agent is important to avoid 403s from some sites
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // 3. Parse Metadata (OpenGraph tags are safest generic bet)
        const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        const ogImage = $('meta[property="og:image"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');

        // Clean title (remove common suffixes like "| MangaLib")
        const cleanTitle = ogTitle.split('|')[0].trim();

        if (!cleanTitle) {
            throw new Error('Could not extract title from page.');
        }

        await supabase.from('scraper_jobs').update({
            progress: 40,
            manga_title: cleanTitle
        }).eq('id', job.id);

        await supabase.from('scraper_logs').insert({
            job_id: job.id,
            source_id: sourceId,
            level: 'info',
            message: `Extracted: ${cleanTitle}`
        });

        // 4. Upsert Manga
        // Check if manga exists by title
        const { data: existingManga, error: existingError } = await supabase
            .from('manga')
            .select('id, title')
            .eq('title', cleanTitle)
            .single();

        let mangaId;

        if (existingManga) {
            // Update existing
            mangaId = existingManga.id;
            const { error: updateError } = await supabase
                .from('manga')
                .update({
                    description: ogDescription || undefined,
                    cover_url: ogImage || undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', mangaId);

            if (updateError) throw updateError;

            await supabase.from('scraper_logs').insert({
                job_id: job.id,
                source_id: sourceId,
                level: 'success',
                message: `Updated existing manga: ${cleanTitle}`
            });
        } else {
            // Create new
            const { data: newManga, error: createError } = await supabase
                .from('manga')
                .insert({
                    title: cleanTitle,
                    description: ogDescription || 'No description found',
                    cover_url: ogImage || 'https://placehold.co/400x600?text=No+Conver',
                    status: 'ONGOING',
                    author: 'Unknown', // Hard to parse generically
                    release_year: new Date().getFullYear(),
                    rating: 0
                })
                .select()
                .single();

            if (createError) throw createError;
            mangaId = newManga.id;

            await supabase.from('scraper_logs').insert({
                job_id: job.id,
                source_id: sourceId,
                level: 'success',
                message: `Created new manga: ${cleanTitle}`
            });
        }

        await supabase.from('scraper_jobs').update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            result_summary: `Processed: ${cleanTitle}`
        }).eq('id', job.id);

    } catch (error: any) {
        console.error('Scraper failed:', error);

        // Try to log error to DB if job exists
        // (If job creation failed, we can't do much but console log)
        if (sourceId) {
            await supabase.from('scraper_logs').insert({
                source_id: sourceId,
                level: 'error',
                message: `Scraping failed: ${error.message}`
            });
        }
    }
}
