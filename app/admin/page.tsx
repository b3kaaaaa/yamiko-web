'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/admin/dashboard/StatsCard';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats/overview');
                const data = await res.json();
                if (isMounted) setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchStats();
        return () => { isMounted = false; };
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-white/10 border-t-primary rounded-full animate-spin mb-4"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Loading Dashboard...</span>
        </div>
    );

    const { overview, charts } = stats || {};

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* HERO SECTION */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/5 p-8 md:p-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                        WELCOME BACK, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">ADMIN</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-lg">
                        System is operating at <span className="text-green-400 font-bold">100% capacity</span>.
                        There are <span className="text-white font-bold">{overview?.new_users_24h || 0}</span> new recruits waiting for approval.
                    </p>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={overview?.total_users?.toLocaleString() || "0"}
                    trend="+12.5%"
                    icon="group"
                    color="blue"
                    trendLabel="vs last month"
                />
                <StatsCard
                    title="Active Now"
                    value={overview?.online_users?.toLocaleString() || "0"}
                    trend="+5%"
                    icon="bolt"
                    color="cyan"
                    trendLabel="Live users"
                />
                <StatsCard
                    title="New Manga"
                    value={overview?.new_manga_7d?.toLocaleString() || "0"}
                    trend="+8.2%"
                    icon="library_books"
                    color="green"
                    trendLabel="Added last 7 days"
                />
                <StatsCard
                    title="Server Load"
                    value={overview?.load_status || "Optimal"}
                    icon="dns"
                    color="purple"
                    trendLabel="System Performance"
                />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COL - ACTIVITY */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">history</span>
                            Recent Activity
                        </h3>
                        <button className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-wider">
                            View All Logs
                        </button>
                    </div>

                    <div className="bg-[#121217]/50 border border-white/5 rounded-2xl p-6 overflow-hidden">
                        <div className="space-y-6">
                            {stats?.recent_logs?.length > 0 ? (
                                stats.recent_logs.map((log: any, i: number) => (
                                    <div key={log.id} className="flex gap-4 group">
                                        <div className="relative mt-1">
                                            <div className={`w-2 h-2 rounded-full ${log.action_type.includes('ban') ? 'bg-red-500' :
                                                    log.action_type.includes('update') ? 'bg-blue-500' : 'bg-gray-700'
                                                } group-hover:scale-125 transition-all`}></div>
                                            {i !== stats.recent_logs.length - 1 && <div className="absolute top-3 left-1 w-px h-10 bg-gray-800 group-hover:bg-gray-700 transition-colors"></div>}
                                        </div>
                                        <div className="pb-2">
                                            <p className="text-sm text-gray-300">
                                                <span className="text-white font-bold hover:text-primary cursor-pointer transition-colors">
                                                    {log.profiles?.nickname || 'System'}
                                                </span>
                                                {' '}{log.action_type.replace('_', ' ')}
                                                {log.target_type && <span className="text-gray-500"> on {log.target_type}</span>}
                                            </p>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No recent activity detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COL - QUICK ACTIONS & ALERTS */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">warning</span>
                        Attention Needed
                    </h3>

                    <div className="bg-[#121217]/50 border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <span className="material-symbols-outlined text-red-500 mt-0.5">report</span>
                            <div>
                                <h4 className="text-red-400 font-bold text-sm">5 User Reports</h4>
                                <p className="text-xs text-red-500/70 mt-1">Unresolved reports awaiting review.</p>
                            </div>
                            <button className="ml-auto text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-400 transition-colors">Review</button>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <span className="material-symbols-outlined text-yellow-500 mt-0.5">storage</span>
                            <div>
                                <h4 className="text-yellow-400 font-bold text-sm">Storage Warning</h4>
                                <p className="text-xs text-yellow-500/70 mt-1">Backup storage at 85% capacity.</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-4">
                        <span className="material-symbols-outlined text-purple-500">rocket_launch</span>
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-[#1A1A23] hover:bg-[#20202A] border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2 group transition-all">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">add_circle</span>
                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Add Manga</span>
                        </button>
                        <button className="bg-[#1A1A23] hover:bg-[#20202A] border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2 group transition-all">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">mail</span>
                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Newsletter</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
