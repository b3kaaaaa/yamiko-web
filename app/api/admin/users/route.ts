// Admin Users API (Supabase)
// GET /api/admin/users - List all users

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const role = searchParams.get('role');

        const supabase = createAdminClient();

        let query = supabase
            .from('profiles')
            .select('id, username, avatar_url, level, exp, rubies, energy, role, created_at, last_login')
            .order('created_at', { ascending: false })
            .limit(100);

        // Apply search filter
        if (search) {
            query = query.or(`username.ilike.%${search}%`);
        }

        // Apply role filter
        if (role) {
            query = query.eq('role', role);
        }

        const { data: users, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json(users || []);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users', details: error.message },
            { status: 500 }
        );
    }
}
