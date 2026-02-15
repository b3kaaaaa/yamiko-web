// Admin Grant EXP API (Supabase)
// POST /api/admin/users/[userId]/exp

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

        const supabase = createAdminClient();

        // Call the add_exp Postgres function
        const { data, error } = await supabase.rpc('add_exp', {
            target_user_id: userId,
            exp_amount: amount,
            reason: reason || 'Admin grant',
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
                expGained: amount,
                leveledUp: data.leveled_up,
                levelsGained: data.levels_gained,
                energyReward: data.energy_reward,
                oldLevel: data.old_level,
                newLevel: data.new_level,
            },
            message: data.message,
        });
    } catch (error: any) {
        console.error('Error granting EXP:', error);
        return NextResponse.json(
            { error: 'Failed to grant EXP', details: error.message },
            { status: 500 }
        );
    }
}
