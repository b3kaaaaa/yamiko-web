// Admin Grant Rubies API (Supabase)
// POST /api/admin/users/[userId]/rubies

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const body = await request.json();
        const { amount, reason } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            );
        }

        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'Reason is required for granting Rubies (premium currency)' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Call the grant_rubies Postgres function
        const { data, error } = await (supabase.rpc as any)('grant_rubies', {
            target_user_id: userId,
            ruby_amount: amount,
            reason: reason,
        });

        if (error) {
            throw error;
        }

        // Fetch updated user data
        const { data: updatedUser } = await supabase
            .from('profiles')
            .select('id, username, level, exp, energy, rubies')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            success: true,
            user: updatedUser,
            changes: {
                rubiesGranted: amount,
                reason: reason,
                oldRubies: data.old_rubies,
                newRubies: data.new_rubies,
            },
            message: data.message,
        });
    } catch (error: any) {
        console.error('Error granting Rubies:', error);
        return NextResponse.json(
            { error: 'Failed to grant Rubies', details: error.message },
            { status: 500 }
        );
    }
}
