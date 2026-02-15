// Supabase Admin Client (Service Role)
// For admin operations that bypass RLS
// ONLY use in API routes, NEVER expose to client

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
