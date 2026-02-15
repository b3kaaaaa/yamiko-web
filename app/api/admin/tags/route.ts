// API: GET /api/admin/tags - List all tags
// POST /api/admin/tags - Create a new tag

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('name');

        if (error) throw error;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('Error fetching tags:', error);
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
            .from('tags')
            .insert({ name: body.name, slug })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, tag: data });
    } catch (error: any) {
        console.error('Error creating tag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
