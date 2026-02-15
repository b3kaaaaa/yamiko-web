// Admin Manga API (Supabase)
// GET /api/admin/manga - List all manga
// POST /api/admin/manga - Create new manga

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { transliterate } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const sort = searchParams.get('sort');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const supabase = createAdminClient();

        let query = supabase
            .from('manga')
            .select(`
        id,
        title,
        slug,
        description,
        cover_url,
        background_video,
        status,
        rating,
        views,
        author,
        artist,
        release_year,
        created_at,
        type,
        age_rating,
        publisher,
        studio,
        country,
        fandom_url,
        forum_url,
        alt_titles,
        translation_status,
        chapters:chapters(count)
      `, { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply status filter
        if (status) {
            query = query.eq('status', status);
        }

        // Apply sorting
        if (sort === 'popular') {
            query = query.order('views', { ascending: false });
        } else if (sort === 'rating') {
            query = query.order('rating', { ascending: false });
        } else if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'chapters') {
            // Sorting by relation count is complex in Supabase/PostgREST
            // For now, default to created_at if chapters chosen, or handle client side
            // We'll stick to created_at for consistency if complicated
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        query = query.range(from, to);

        const { data: manga, error, count } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: manga || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Error fetching manga:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['title', 'description', 'cover_url', 'status'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate status check constraint
        const validStatuses = ['ONGOING', 'COMPLETED', 'FROZEN', 'HIATUS'];
        const status = body.status?.toUpperCase() || 'ONGOING';
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Generate slug from title
        const sourceText = body.slug || transliterate(body.title);
        let baseSlug = sourceText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let suffix = 1;

        // Check for existing slug loop
        while (true) {
            const { data: existing } = await supabase
                .from('manga')
                .select('id')
                .eq('slug', slug)
                .single();

            if (!existing) break;

            slug = `${baseSlug}-${suffix}`;
            suffix++;
        }

        // Insert manga
        // Note: Using snake_case for Supabase direct query as verified in schema.sql
        const { data: newManga, error } = await supabase
            .from('manga')
            .insert({
                title: body.title,
                slug: slug,
                description: body.description,
                cover_url: body.cover_url,
                background_video: body.background_video || null,
                status: status, // Use validated uppercase status
                author: body.author || null,
                artist: body.artist || null,
                release_year: body.release_year ? parseInt(body.release_year) : null,
                type: body.type || 'MANHWA',
                age_rating: body.age_rating || '16+',
                publisher: body.publisher || null,
                studio: body.studio || null,
                country: body.country || 'KR',
                fandom_url: body.fandom_url || null,
                forum_url: body.forum_url || null,
                alt_titles: body.alt_titles || null,
                translation_status: body.translation_status || 'ONGOING',
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            manga: newManga,
            message: `✅ Manga "${body.title}" created successfully!`,
        });
    } catch (error: any) {
        console.error('Error creating manga:', error);
        return NextResponse.json(
            {
                error: 'Failed to create manga',
                details: error.message || error.toString(),
                hint: error.code === '23505' ? 'Unique constraint violation (slug or title)' : undefined
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { error: 'Manga ID is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Build update payload - only include fields that were provided
        const updatePayload: Record<string, any> = {};
        const allowedUpdateFields = [
            'title', 'description', 'cover_url', 'background_video', 'status',
            'author', 'artist', 'release_year', 'type', 'age_rating',
            'publisher', 'studio', 'country', 'fandom_url', 'forum_url',
            'alt_titles', 'translation_status',
        ];

        for (const field of allowedUpdateFields) {
            if (body[field] !== undefined) {
                updatePayload[field] = body[field];
            }
        }

        // Update manga
        const { data: updatedManga, error } = await supabase
            .from('manga')
            .update(updatePayload)
            .eq('id', body.id)
            .select()
            .single();

        // Handle genre associations if provided
        if (body.genre_ids && Array.isArray(body.genre_ids)) {
            // Delete old associations
            await supabase.from('manga_genres').delete().eq('manga_id', body.id);
            // Insert new ones
            if (body.genre_ids.length > 0) {
                await supabase.from('manga_genres').insert(
                    body.genre_ids.map((genreId: string) => ({
                        manga_id: body.id,
                        genre_id: genreId,
                    }))
                );
            }
        }

        // Handle tag associations if provided
        if (body.tag_ids && Array.isArray(body.tag_ids)) {
            // Delete old associations
            await supabase.from('manga_tags').delete().eq('manga_id', body.id);
            // Insert new ones
            if (body.tag_ids.length > 0) {
                await supabase.from('manga_tags').insert(
                    body.tag_ids.map((tagId: string) => ({
                        manga_id: body.id,
                        tag_id: tagId,
                    }))
                );
            }
        }

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            manga: updatedManga,
            message: `✅ Manga updated successfully!`,
        });
    } catch (error: any) {
        console.error('Error updating manga:', error);
        return NextResponse.json(
            { error: 'Failed to update manga', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Manga ID is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('manga')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `✅ Manga deleted successfully!`,
        });
    } catch (error: any) {
        console.error('Error deleting manga:', error);
        return NextResponse.json(
            { error: 'Failed to delete manga', details: error.message },
            { status: 500 }
        );
    }
}
