// API: GET /api/admin/manga/[id]/chapters - List chapters for a manga
// DELETE /api/admin/manga/[id]/chapters?chapterId=... - Delete a chapter

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = createAdminClient();

        // Get manga title
        const { data: manga } = await supabase
            .from('manga')
            .select('title')
            .eq('id', id)
            .single();

        // Get chapters
        const { data: chapters, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('manga_id', id)
            .order('chapter_number', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            chapters: chapters || [],
            manga_title: manga?.title || '',
        });
    } catch (error: any) {
        console.error('Error fetching chapters:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chapters', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');

        if (!chapterId) {
            return NextResponse.json(
                { error: 'Chapter ID is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('chapters')
            .delete()
            .eq('id', chapterId)
            .eq('manga_id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: '✅ Chapter deleted successfully!',
        });
    } catch (error: any) {
        console.error('Error deleting chapter:', error);
        return NextResponse.json(
            { error: 'Failed to delete chapter', details: error.message },
            { status: 500 }
        );
    }
}
