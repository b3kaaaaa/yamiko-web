"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import LogTable from "@/components/admin/logs/LogTable";

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const { data, error } = await supabase
                    .from("admin_audit_logs")
                    .select("*, profiles(nickname, avatar_url)")
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) {
                    console.error("Supabase Error fetching logs:", error);
                    throw error;
                }
                setLogs(data || []);
            } catch (err: any) {
                console.error("Comprehensive Error fetching logs:", err.message || err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end border-l-4 border-blue-500 pl-6 h-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">System Logs</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Audit Trail & Security Events</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">filter_list</span>
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/30 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Retrieving Data...</span>
                </div>
            ) : (
                <LogTable logs={logs} />
            )}
        </div>
    );
}
