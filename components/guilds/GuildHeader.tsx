'use client';

import { motion } from 'framer-motion';
import { FullGuildData } from '@/types/guild';

interface GuildHeaderProps {
    data: FullGuildData;
    onJoin: () => void;
    onLeave: () => void;
    onDonate: () => void; // Open donate modal
    onManage?: () => void; // Redirect to admin or open modal
}

export default function GuildHeader({ data, onJoin, onLeave, onDonate, onManage }: GuildHeaderProps) {
    const { info, user_status, members } = data;

    return (
        <div className="relative w-full mb-8 group">
            {/* Banner */}
            <div className="h-[250px] md:h-[350px] w-full relative overflow-hidden rounded-b-[2.5rem] shadow-2xl">
                {info.banner_url ? (
                    <img
                        src={info.banner_url}
                        alt={info.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/40 to-transparent" />

                {/* Overlay Info */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 container mx-auto">
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-6 md:gap-8">
                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-[#121217] p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 ring-4 ring-white/5">
                                {info.avatar_url ? (
                                    <img
                                        src={info.avatar_url}
                                        alt={info.name}
                                        className="w-full h-full object-cover rounded-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 rounded-2xl flex items-center justify-center text-4xl font-black text-gray-600">
                                        {info.tag[0]}
                                    </div>
                                )}
                            </div>
                            {/* Level Badge */}
                            <div className="absolute -top-3 -right-3 bg-primary text-white text-lg font-black px-3 py-1.5 rounded-xl shadow-lg border-2 border-[#121217] flex flex-col items-center leading-none min-w-[3.5rem]">
                                <span className="text-[9px] uppercase font-bold opacity-80">LVL</span>
                                {info.level}
                            </div>
                        </motion.div>

                        {/* Text Info */}
                        <div className="flex-1 mb-2">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-sm font-bold text-gray-300 uppercase tracking-wider">
                                        [{info.tag}]
                                    </span>
                                    {user_status.is_member && (
                                        <span className="bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Вы участник
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white leading-none drop-shadow-xl mb-3">
                                    {info.name}
                                </h1>
                                <div className="flex items-center gap-6 text-gray-300 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px] text-primary">group</span>
                                        <span>{members.total_count} / {members.max_count} Участников</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px] text-yellow-500">star</span>
                                        <span>{(info.xp || 0).toLocaleString()} XP</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Actions */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-3 self-end md:self-center mb-2"
                        >
                            {user_status.is_member ? (
                                <>
                                    <button
                                        onClick={onDonate}
                                        className="bg-[#121217]/80 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl font-bold backdrop-blur-md transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-yellow-500">savings</span>
                                        Казна
                                    </button>

                                    {user_status.can_manage && (
                                        <button
                                            onClick={onManage}
                                            className="bg-[#121217]/80 hover:bg-white/10 text-white border border-white/10 px-4 py-3 rounded-2xl font-bold backdrop-blur-md transition-all"
                                            title="Управление"
                                        >
                                            <span className="material-symbols-outlined">settings</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={onLeave}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-3 rounded-2xl font-bold backdrop-blur-md transition-all"
                                        title="Покинуть гильдию"
                                    >
                                        <span className="material-symbols-outlined">logout</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onJoin}
                                    className="bg-primary hover:bg-primaryHover text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Вступить
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
