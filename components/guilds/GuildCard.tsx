'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface GuildCardProps {
    guild: {
        id: string;
        name: string;
        tag: string;
        level: number;
        member_count: number;
        avatar_url: string | null;
        banner_url: string | null;
        is_recruiting: boolean;
        total_xp?: number;
    };
    index?: number;
}

export default function GuildCard({ guild, index = 0 }: GuildCardProps) {
    return (
        <div className="bg-[#121217] border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/40 transition-all relative h-full flex flex-col">
            {/* Banner */}
            <div className="h-32 bg-gray-800 relative overflow-hidden shrink-0">
                {guild.banner_url ? (
                    <img
                        src={guild.banner_url}
                        alt={guild.name}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-60"></div>
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </>
                )}
            </div>

            {/* Avatar - Overlapping */}
            <div className="absolute top-20 left-6 w-20 h-20 rounded-2xl bg-[#121217] p-1 border border-white/10 shadow-xl z-10">
                {guild.avatar_url ? (
                    <img
                        src={guild.avatar_url}
                        alt={guild.name}
                        className="w-full h-full object-cover rounded-xl"
                    />
                ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                        {guild.tag ? guild.tag[0].toUpperCase() : '?'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pt-12 px-6 pb-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2 line-clamp-1">
                            {guild.name}
                            {/* Verified badge placeholder if needed */}
                            {/* <span className="material-symbols-outlined text-blue-400 text-[18px]">verified</span> */}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            [{guild.tag}] Уровень {guild.level}
                        </p>
                    </div>
                    {/* Rank Number Mockup */}
                    <div className="text-right">
                        <span className="text-2xl font-black text-white/10 italic select-none group-hover:text-primary/10 transition-colors">#{index + 1}</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 my-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Уровень</div>
                        <div className="text-lg font-bold text-white">{guild.level}</div>
                    </div>
                    <div className="text-center border-l border-white/5">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Участники</div>
                        <div className="text-lg font-bold text-white">
                            {guild.member_count >= 1000 ? (guild.member_count / 1000).toFixed(1) + 'k' : guild.member_count}
                        </div>
                    </div>
                    <div className="text-center border-l border-white/5">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Очки</div>
                        <div className="text-lg font-bold text-primary">
                            {guild.total_xp ? (guild.total_xp >= 1000000 ? (guild.total_xp / 1000000).toFixed(1) + 'm' : (guild.total_xp / 1000).toFixed(1) + 'k') : '0'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                    {/* Mock Member Avatars */}
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-[#121217] bg-gray-600"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-[#121217] bg-gray-500"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-[#121217] bg-gray-400 flex items-center justify-center text-[10px] text-white font-bold">+</div>
                    </div>

                    <Link
                        href={`/guilds/${guild.tag}`}
                        className="px-6 py-2 rounded-lg bg-[#1C1C22] hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/5 hover:border-white/20"
                    >
                        Подробнее
                    </Link>
                </div>
            </div>
        </div>
    );
}
