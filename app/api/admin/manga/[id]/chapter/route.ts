// API Route: POST /api/admin/manga/[id]/chapter
// Create a new chapter for a manga (Supabase version)

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.number && body.number !== 0) {
            return NextResponse.json(
                { success: false, error: 'Chapter number is required' },
                { status: 400 }
            );
        }

        if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one image URL is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if chapter number already exists for this manga
        const { data: existing } = await supabase
            .from('chapters')
            .select('id')
            .eq('manga_id', id)
            .eq('chapter_number', body.number)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { success: false, error: `Chapter ${body.number} already exists for this manga` },
                { status: 400 }
            );
        }

        // Insert chapter
        const { data: chapter, error } = await supabase
            .from('chapters')
            .insert({
                manga_id: id,
                title: body.title || `Глава ${body.number}`,
                chapter_number: parseFloat(body.number),
                pages: body.images,
                // is_locked: body.isLocked || false, // Column missing in DB
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase chapter insert error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            chapter,
            message: `✅ Chapter ${body.number} created successfully!`,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error in POST /api/admin/manga/[id]/chapter:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
