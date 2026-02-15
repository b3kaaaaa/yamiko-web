// API: GET /api/admin/genres - List all genres
// POST /api/admin/genres - Create a new genre

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('genres')
            .select('*')
            .order('name');

        if (error) throw error;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('Error fetching genres:', error);
        return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('genres')
            .insert({ name: body.name, slug })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, genre: data });
    } catch (error: any) {
        console.error('Error creating genre:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
