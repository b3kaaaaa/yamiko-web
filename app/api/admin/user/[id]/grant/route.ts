// API Route: POST /api/admin/user/[id]/grant
// Grant EXP or Rubies to a user (Admin support tool)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { grantExp, grantRubies } from '@/lib/services/gamification';

const grantSchema = z.object({
    type: z.enum(['exp', 'rubies']),
    amount: z.number().int().positive(),
    reason: z.string().min(1).max(200),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Validate input with Zod
        const validation = grantSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.errors,
                },
                { status: 400 }
            );
        }

        // TODO: Add authentication check
        // const session = await getServerSession();
        // if (!session || session.user.role !== 'ADMIN') {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { type, amount, reason } = validation.data;
        const userId = id;

        let result;

        if (type === 'exp') {
            result = await grantExp(userId, amount, reason);
        } else {
            result = await grantRubies(userId, amount, reason);
        }

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Error in POST /api/admin/user/[id]/grant:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
