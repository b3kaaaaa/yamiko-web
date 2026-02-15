'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { GuildRole } from '@/types/guild';

interface GuildMembersProps {
    guildId: string;
}

interface MemberWithProfile {
    user_id: string;
    role: GuildRole;
    contribution_xp: number;
    contribution_gold: number;
    joined_at: string;
    profiles: {
        id: string;
        username: string;
        avatar_url: string | null;
        level: number;
    };
}

const ROLE_CONFIG: Record<GuildRole, { label: string; icon: string; color: string }> = {
    leader: { label: 'Лидер', icon: 'crown', color: 'text-yellow-500' },
    officer: { label: 'Офицер', icon: 'shield', color: 'text-blue-400' },
    veteran: { label: 'Ветеран', icon: 'star', color: 'text-purple-400' },
    member: { label: 'Участник', icon: 'person', color: 'text-gray-400' },
    recruit: { label: 'Новичок', icon: 'egg', color: 'text-gray-600' }
};

export default function GuildMembers({ guildId }: GuildMembersProps) {
    const [members, setMembers] = useState<MemberWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<'role' | 'xp' | 'joined'>('role');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('guild_members')
                .select('*, profiles(id, username, avatar_url, level)')
                .eq('guild_id', guildId);

            if (error) {
                console.error('Error fetching members:', error);
            } else if (data) {
                // Initial sort by role priority
                const sorted = sortMembers(data as any[], 'role');
                setMembers(sorted);
            }
            setLoading(false);
        };

        fetchMembers();
    }, [guildId]);

    const sortMembers = (list: MemberWithProfile[], criterion: string) => {
        const rolePriority = { leader: 0, officer: 1, veteran: 2, member: 3, recruit: 4 };

        return [...list].sort((a, b) => {
            if (criterion === 'role') {
                return rolePriority[a.role] - rolePriority[b.role];
            }
            if (criterion === 'xp') {
                return b.contribution_xp - a.contribution_xp;
            }
            if (criterion === 'joined') {
                return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
            }
            return 0;
        });
    };

    const handleSort = (criterion: 'role' | 'xp' | 'joined') => {
        setSort(criterion);
        setMembers(prev => sortMembers(prev, criterion));
    };

    if (loading) {
        return <div className="py-20 text-center text-gray-500 animate-pulse">Загрузка списка участников...</div>;
    }

    return (
        <div className="bg-[#121217] border border-white/5 rounded-3xl overflow-hidden">
            {/* Header Controls */}
            <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">groups</span>
                    Список Участников
                    <span className="text-sm font-normal text-gray-500 ml-2 bg-white/5 px-2 py-0.5 rounded-lg">
                        {members.length}
                    </span>
                </h3>

                <div className="flex gap-2">
                    {['role', 'xp', 'joined'].map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSort(s as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${sort === s
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            {s === 'role' ? 'По рангу' : s === 'xp' ? 'По вкладу' : 'По дате'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5">
                {members.map((member) => {
                    const profile = member.profiles;
                    const roleConfig = ROLE_CONFIG[member.role];

                    return (
                        <div key={member.user_id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                {/* Role Icon */}
                                <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center ${roleConfig.color} border border-white/5`}>
                                    <span className="material-symbols-outlined">{roleConfig.icon}</span>
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-white group-hover:text-primary transition-colors cursor-pointer">
                                            {profile.username}
                                        </h4>
                                        <span className={`text-[10px] font-bold uppercase px-1.5 rounded bg-white/5 ${roleConfig.color}`}>
                                            {roleConfig.label}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-3">
                                        <span>LVL {profile.level}</span>
                                        <span>•</span>
                                        <span>Вклад: {member.contribution_xp.toLocaleString()} XP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions (placeholder for kick/promote) */}
                            <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-white transition-all">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
