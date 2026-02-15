// API Route: PUT /api/admin/gacha/config
// Update gacha drop rates configuration

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateDropRates, getDropRates } from '@/lib/services/economy';

const updateDropRatesSchema = z.object({
    packType: z.string(),
    rates: z.object({
        COMMON: z.number().min(0).max(100),
        RARE: z.number().min(0).max(100),
        SR: z.number().min(0).max(100),
        SSR: z.number().min(0).max(100),
        UR: z.number().min(0).max(100),
    }),
});

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validation = updateDropRatesSchema.safeParse(body);

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

        const result = updateDropRates(validation.data.packType, validation.data.rates);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: (result as any).error },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in PUT /api/admin/gacha/config:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const packType = searchParams.get('packType') || 'STANDARD';

        const rates = getDropRates(packType);

        return NextResponse.json({
            success: true,
            data: {
                packType,
                rates,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/admin/gacha/config:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
