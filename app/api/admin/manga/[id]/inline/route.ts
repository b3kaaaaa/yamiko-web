// API: PATCH /api/admin/manga/[id]/inline - Inline single-field update

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { field, value } = body;

        if (!field) {
            return NextResponse.json(
                { error: 'Field name is required' },
                { status: 400 }
            );
        }

        // Only allow specific fields to be updated inline
        const allowedFields = [
            'title', 'description', 'status', 'type', 'age_rating',
            'author', 'artist', 'publisher', 'studio', 'country',
            'release_year', 'translation_status', 'fandom_url', 'forum_url',
            'alt_titles', 'cover_url', 'background_video',
        ];

        if (!allowedFields.includes(field)) {
            return NextResponse.json(
                { error: `Field "${field}" is not allowed for inline update` },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { data: updated, error } = await supabase
            .from('manga')
            .update({ [field]: value })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            manga: updated,
            message: `✅ Поле "${field}" обновлено`,
        });
    } catch (error: any) {
        console.error('Error inline updating manga:', error);
        return NextResponse.json(
            { error: 'Failed to update field', details: error.message },
            { status: 500 }
        );
    }
}
