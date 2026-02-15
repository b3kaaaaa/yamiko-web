import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, username } = body;

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createAdminClient();

        // 1. Create User (Auto-confirm email)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username: username
            }
        });

        if (authError) {
            console.error('Supabase Auth Error:', authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (authData.user) {
            // 2. Create Profile (Bypassing RLS with Admin Client)
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    username: username,
                    level: 1,
                    exp: 0,
                    energy: 100,
                    rubies: 0,
                    role: 'USER'
                });

            if (profileError) {
                console.error('Profile Creation Error:', profileError);
                // If profile creation fails, we technically have a broken user.
                // In production, we might want to rollback (delete user), 
                // but for now we'll just report the error.
                // Commonly commonly caused by username unique constraint.

                if (profileError.code === '23505') { // Unique violation
                    return NextResponse.json(
                        { error: 'Username or Email already exists' },
                        { status: 400 }
                    );
                }

                return NextResponse.json(
                    { error: 'Failed to create user profile' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                user: authData.user,
                message: 'User registered successfully'
            });
        }

        return NextResponse.json(
            { error: 'Registration failed unexpectedly' },
            { status: 500 }
        );

    } catch (error: any) {
        console.error('Registration API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
