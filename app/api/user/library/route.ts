// API Route: POST /api/user/library
// Add manga to user's bookmarks

import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mangaId, status } = body;

        if (!mangaId) {
            return NextResponse.json(
                { error: 'Manga ID is required' },
                { status: 400 }
            );
        }

        // Get session from supabase to verify user
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const supabaseAdmin = createAdminClient();

        // If status is null, remove the bookmark
        if (status === null) {
            const { error: deleteError } = await supabaseAdmin
                .from('library_entries')
                .delete()
                .eq('user_id', userId)
                .eq('manga_id', mangaId);

            if (deleteError) throw deleteError;

            return NextResponse.json(
                { message: 'Removed from library', bookmarked: false },
                { status: 200 }
            );
        }

        // Upsert (Insert or Update)
        const { data: entry, error: upsertError } = await supabaseAdmin
            .from('library_entries')
            .upsert({
                user_id: userId,
                manga_id: mangaId,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, manga_id' })
            .select()
            .single();

        if (upsertError) {
            throw upsertError;
        }

        return NextResponse.json(
            { message: 'Updated library status', bookmarked: true, entry },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating library:', error);
        return NextResponse.json(
            { error: 'Failed to update library', details: error.message },
            { status: 500 }
        );
    }
}
