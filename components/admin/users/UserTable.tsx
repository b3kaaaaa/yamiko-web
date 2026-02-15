"use client";

import { useState } from "react";
import { format } from "date-fns";

type User = {
    id: string;
    username: string;
    nickname: string | null;
    avatar_url: string | null;
    email?: string; // from auth.users (not available in profiles directly unless joined or using admin api)
    role: string;
    level: number;
    rank_tier: string;
    rubies: number;
    energy: number;
    is_online: boolean;
    created_at: string;
    classes: {
        name: string;
    } | null;
};

export default function UserTable({ users }: { users: User[] }) {
    if (!users?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-[#121217]/50 rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-gray-700 text-[48px] mb-4">group_off</span>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Users Found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#121217]/50">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-black/40 text-[10px] uppercase font-black tracking-wider text-gray-500">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">RPG Stats</th>
                        <th className="px-6 py-4">Resources</th>
                        <th className="px-6 py-4">Role & Status</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                            {/* USER INFO */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden border border-white/5">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                                                <span className="text-xs font-black text-gray-600">{user.username?.[0]?.toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{user.nickname || user.username}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-600 font-bold max-w-[100px] truncate">{user.id}</div>
                                    </div>
                                </div>
                            </td>

                            {/* RPG STATS */}
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                                            LVL {user.level}
                                        </span>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${user.rank_tier === 'S' || user.rank_tier === 'National'
                                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            RANK {user.rank_tier}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        {user.classes?.name || 'No Class'}
                                    </div>
                                </div>
                            </td>

                            {/* RESOURCES */}
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                                        <span className="material-symbols-outlined text-[14px]">diamond</span>
                                        {user.rubies.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        {user.energy}/100
                                    </div>
                                </div>
                            </td>

                            {/* ROLE & STATUS */}
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        }`}>
                                        {user.role}
                                    </span>
                                    {user.is_online && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            ONLINE
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* JOINED */}
                            <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                {format(new Date(user.created_at), "dd MMM yyyy")}
                            </td>

                            {/* ACTIONS */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Edit User">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors border border-red-500/20" title="Ban User">
                                        <span className="material-symbols-outlined text-[18px]">block</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
