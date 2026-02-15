// API: GET /api/admin/manga/[id] - Get manga details by ID
// PATCH /api/admin/manga/[id]/inline - Inline field update

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = createAdminClient();

        const { data: manga, error } = await supabase
            .from('manga')
            .select(`
                *,
                manga_genres(genre_id, genres(id, name, slug)),
                manga_tags(tag_id, tags(id, name, slug))
            `)
            .eq('id', id)
            .single();

        if (error) {
            // Try fallback without relations (in case relation tables don't exist yet)
            const { data: mangaFallback, error: fallbackErr } = await supabase
                .from('manga')
                .select('*')
                .eq('id', id)
                .single();

            if (fallbackErr) throw fallbackErr;

            return NextResponse.json({
                manga: {
                    ...mangaFallback,
                    genre_ids: [],
                    tag_ids: [],
                    genres: [],
                    tags: [],
                }
            });
        }

        // Extract genre and tag IDs
        const genre_ids = (manga.manga_genres || []).map((mg: any) => mg.genre_id);
        const tag_ids = (manga.manga_tags || []).map((mt: any) => mt.tag_id);
        const genres = (manga.manga_genres || []).map((mg: any) => mg.genres).filter(Boolean);
        const tags = (manga.manga_tags || []).map((mt: any) => mt.tags).filter(Boolean);

        return NextResponse.json({
            manga: {
                ...manga,
                genre_ids,
                tag_ids,
                genres,
                tags,
                manga_genres: undefined,
                manga_tags: undefined,
            }
        });
    } catch (error: any) {
        console.error('Error fetching manga detail:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga', details: error.message },
            { status: 500 }
        );
    }
}
