"use client";

import { format } from "date-fns";

type Log = {
    id: string;
    action_type: string;
    target_type: string;
    target_id: string;
    details: any;
    created_at: string;
    profiles: {
        nickname: string;
        avatar_url: string;
    } | null;
};

export default function LogTable({ logs }: { logs: Log[] }) {
    if (!logs?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-[#121217]/50 rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-gray-700 text-[48px] mb-4">terminal</span>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No System Logs Found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#121217]/50">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-black/40 text-xs uppercase font-black tracking-wider text-gray-500">
                    <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Admin</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Target</th>
                        <th className="px-6 py-4">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                                {format(new Date(log.created_at), "dd MMM HH:mm:ss")}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                                        {/* Avatar Fallback or Image */}
                                        {log.profiles?.avatar_url && (
                                            <img src={log.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-300">{log.profiles?.nickname || 'Unknown'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${log.action_type.includes('ban') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        log.action_type.includes('update') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {log.action_type}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">
                                <span className="text-gray-500">{log.target_type}:</span> {log.target_id || '-'}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-xs font-mono text-gray-500 group-hover:text-gray-400">
                                {JSON.stringify(log.details)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
