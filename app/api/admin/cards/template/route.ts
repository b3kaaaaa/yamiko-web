// API Route: POST /api/admin/cards/template
// Create a new card template

import { NextRequest, NextResponse } from 'next/server';
import { createCardTemplateSchema } from '@/lib/validations';
import { createCardTemplate } from '@/lib/services/economy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validation = createCardTemplateSchema.safeParse(body);

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

        const result = await createCardTemplate(validation.data);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: (result as any).error },
                { status: 400 }
            );
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/admin/cards/template:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
