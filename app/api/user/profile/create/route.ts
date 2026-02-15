import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify the user is authenticated using the Server Client (cookies)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse request body for username (optional, fallback generated here)
        // We trust the user ID from the session, not the body.
        const body = await request.json().catch(() => ({}));

        let username = body.username;
        if (!username) {
            const baseName = user.user_metadata.username || user.email?.split('@')[0] || 'User';
            const uniqueSuffix = Math.floor(Math.random() * 10000);
            username = `${baseName}_${uniqueSuffix}`;
        }

        // 3. Use Admin Client to insert profile (Bypassing RLS)
        const supabaseAdmin = createAdminClient();

        const newProfile = {
            id: user.id,
            username: username,
            // email: user.email, // Removing email as column likely doesn't exist based on previous error
            level: 1,
            exp: 0,
            energy: 100,
            rubies: 0,
            role: 'USER'
        };

        const { data, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

        if (insertError) {
            console.error("API: Failed to create profile:", insertError);

            // Should handle unique violation for username loop if strictly needed,
            // but random suffix makes it unlikely for now.
            if (insertError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Username taken' }, { status: 409 });
            }

            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            profile: data
        });

    } catch (error: any) {
        console.error('API: Create Profile Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
