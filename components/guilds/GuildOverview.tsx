'use client';

import { FullGuildData } from '@/types/guild';

interface GuildOverviewProps {
    data: FullGuildData;
}

export default function GuildOverview({ data }: GuildOverviewProps) {
    const { info, state, user_status } = data;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Description & Stats (Span 2) */}
            <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <div className="bg-[#121217] border border-white/5 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        О Гильдии
                    </h3>
                    <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {info.description || "Лидер гильдии еще не добавил описание..."}
                    </p>
                </div>

                {/* Active Raids */}
                <div className="bg-[#121217] border border-white/5 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">swords</span>
                        Активные Рейды
                    </h3>

                    {state.active_raids.length > 0 ? (
                        <div className="grid gap-4">
                            {state.active_raids.map(raid => (
                                <div key={raid.raid_id} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined">skull</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{raid.boss_name}</h4>
                                            <div className="text-xs text-gray-400">Участников: {raid.participants}</div>
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-red-400">HP</span>
                                            <span className="text-gray-400">{Math.round((raid.current_hp / raid.max_hp) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 transition-all duration-500"
                                                style={{ width: `${(raid.current_hp / raid.max_hp) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Нет активных рейдов
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Treasury & Info (Span 1) */}
            <div className="space-y-6">
                {/* Treasury Box - Only visible to members */}
                {user_status.is_member && (
                    <div className="bg-gradient-to-br from-[#121217] to-primary/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-[100px]">savings</span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">Казна Гильдии</h3>

                        <div className="space-y-4 relative z-10">
                            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
                                <span className="text-gray-400 text-sm font-bold uppercase">Золото</span>
                                <div className="flex items-center gap-1.5 text-yellow-400 font-black">
                                    <span className="material-symbols-outlined text-[16px] filled">monetization_on</span>
                                    {info.treasury_gold.toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
                                <span className="text-gray-400 text-sm font-bold uppercase">Рубины</span>
                                <div className="flex items-center gap-1.5 text-red-500 font-black">
                                    <span className="material-symbols-outlined text-[16px] filled">diamond</span>
                                    {info.treasury_rubies.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="bg-[#121217] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Информация</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-400">Создана</span>
                            <span className="text-white font-medium">Recently</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-400">Лидер</span>
                            <span className="text-primary font-bold">
                                {data.members.top_5.find(m => m.role === 'leader')?.username || "Unknown"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-400">Статус</span>
                            <span className={info.is_recruiting ? "text-green-400" : "text-red-400"}>
                                {info.is_recruiting ? "Открыт набор" : "Закрыт"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
