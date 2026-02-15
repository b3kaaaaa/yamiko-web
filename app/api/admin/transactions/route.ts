// Admin Transactions API (Supabase)
// GET /api/admin/transactions

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const supabase = createAdminClient();

        let query = supabase
            .from('transactions')
            .select(`
        id,
        type,
        amount,
        description,
        created_at,
        user_id,
        profiles!inner(username, avatar_url)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (type) {
            query = query.eq('type', type);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: transactions, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json(transactions || []);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions', details: error.message },
            { status: 500 }
        );
    }
}
