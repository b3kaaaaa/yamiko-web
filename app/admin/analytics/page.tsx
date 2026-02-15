"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import { AreaChart, BarChart } from "@/components/admin/analytics/AnalyticsCharts";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>({
        traffic: [120, 150, 180, 220, 200, 250, 300, 280, 320, 350, 400, 380],
        engagement: [45, 52, 49, 60, 55, 65, 70],
        topContent: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                // Fetch Top Content using RPC
                const { data: popularData, error } = await (supabase.rpc as any)('get_popular_feed', {
                    filter_type: 'views',
                    time_period: '30_days',
                    limit_count: 5
                });

                if (error) throw error;

                // Use real data if available, otherwise mock or empty
                setStats((prev: any) => ({
                    ...prev,
                    topContent: (popularData as any)?.data || []
                }));

            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end border-l-4 border-green-500 pl-6 h-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Analytics Hub</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Growth & Engagement Data</p>
                </div>
                <div className="flex bg-[#1A1A23] rounded-lg p-1 border border-white/5">
                    <button className="px-4 py-1.5 rounded-md bg-white/10 text-white text-[10px] font-bold uppercase">7 Days</button>
                    <button className="px-4 py-1.5 rounded-md text-gray-500 hover:text-white text-[10px] font-bold uppercase transition-colors">30 Days</button>
                    <button className="px-4 py-1.5 rounded-md text-gray-500 hover:text-white text-[10px] font-bold uppercase transition-colors">YTD</button>
                </div>
            </div>

            {/* TRAFFIC CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#121217]/50 border border-white/5 h-80 relative">
                    <div className="absolute top-6 left-6 z-10">
                        <h3 className="text-lg font-bold text-white mb-1">User Traffic</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Total Sessions</p>
                    </div>
                    <div className="absolute top-6 right-6 z-10 text-right">
                        <h3 className="text-2xl font-black text-white">45.2K</h3>
                        <p className="text-xs text-green-500 uppercase tracking-widest font-bold">+12% vs last</p>
                    </div>
                    <div className="w-full h-full pt-10">
                        <AreaChart data={stats.traffic} color="blue" />
                    </div>
                </div>

                {/* ENGAGEMENT CHART */}
                <div className="p-6 rounded-3xl bg-[#121217]/50 border border-white/5 h-80 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Daily Engagement</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Avg. Minutes Spent</p>
                    </div>
                    <div className="flex-1 w-full">
                        <BarChart
                            data={stats.engagement}
                            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                        />
                    </div>
                </div>
            </div>

            {/* TOP CONTENT TABLE */}
            <div className="p-6 rounded-3xl bg-[#121217]/50 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500">star</span>
                    Top Performing Content
                </h3>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-[10px] uppercase font-black tracking-wider text-gray-500 border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3 text-right">Views (30d)</th>
                                    <th className="px-4 py-3 text-right">Trend Score</th>
                                    <th className="px-4 py-3 text-right">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.topContent.map((manga: any, idx: number) => (
                                    <tr key={manga.id} className="hover:bg-white/[0.02] group">
                                        <td className="px-4 py-4 font-black text-gray-600">#{idx + 1}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-10 rounded bg-gray-800 bg-cover bg-center" style={{ backgroundImage: `url(${manga.cover_url})` }}></div>
                                                <span className="font-bold text-white">{manga.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-xs">{manga.views_30_days?.toLocaleString() || '-'}</td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-green-500 font-bold text-xs">+{Math.round(manga.trend_score || 0)}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-black border border-yellow-500/20">
                                                {manga.rating || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
