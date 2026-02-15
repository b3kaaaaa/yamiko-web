import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const adminUser = await verifyAdmin();
        if (!adminUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const supabase = await createClient();

        // Parallel fetching of top-level metrics
        const [
            { count: totalUsers },
            { count: newUsers24h },
            { count: onlineUsers },
            { count: newManga7d },
            { data: recentLogs },
            economyData
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .eq('is_online', true),
            supabase.from('manga').select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
            supabase.from('admin_audit_logs').select('*, profiles(nickname)')
                .order('created_at', { ascending: false })
                .limit(5),
            // Simulated economy data
            Promise.resolve([
                { time: 'MON', bought: 120, spent: 45 },
                { time: 'TUE', bought: 150, spent: 80 },
                { time: 'WED', bought: 200, spent: 110 },
                { time: 'THU', bought: 180, spent: 90 },
                { time: 'FRI', bought: 250, spent: 150 },
                { time: 'SAT', bought: 300, spent: 200 },
                { time: 'SUN', bought: 280, spent: 180 },
            ])
        ]);

        return NextResponse.json({
            overview: {
                total_users: totalUsers || 0,
                new_users_24h: newUsers24h || 0,
                online_users: onlineUsers || 0,
                new_manga_7d: newManga7d || 0,
                trend_percent: 12.5,
                load_status: 'Optimal'
            },
            recent_logs: recentLogs || [],
            charts: {
                economy_influx: economyData
            }
        });
    } catch (error) {
        console.error('Admin Overview Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
