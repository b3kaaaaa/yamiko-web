import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminUser {
    id: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
}

export async function verifyAdmin(): Promise<AdminUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN')) {
        return null;
    }

    return { id: user.id, role: profile.role as 'ADMIN' | 'SUPER_ADMIN' };
}

export async function logAdminAction(
    adminId: string,
    actionType: string,
    targetId: string | null,
    targetType: string | null,
    details: any,
    ipAddress?: string
) {
    const supabase = createAdminClient();
    await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action_type: actionType,
        target_id: targetId,
        target_type: targetType,
        details,
        ip_address: ipAddress || 'Internal'
    });
}
