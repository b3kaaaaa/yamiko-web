"use client";

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MangaContentProps {
    manga: any;
}

export default function MangaContent({ manga }: MangaContentProps) {
    const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'CHAPTERS' | 'REVIEWS' | 'RELATED'>('DESCRIPTION');
    const [searchQuery, setSearchQuery] = useState('');

    // Sort chapters desc by number
    const sortedChapters = [...(manga.chapters || [])].sort((a, b) => b.number - a.number);

    // Filter chapters
    const filteredChapters = sortedChapters.filter(ch =>
        ch.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.number.toString().includes(searchQuery)
    );

    const formatTimeAgo = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Custom simple formatting to match design roughly
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дн.`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед.`;

        return date.toLocaleDateString('ru-RU');
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-8 border-b border-white/5 mb-2 px-2 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('DESCRIPTION')}
                    className={`pb-4 text-base font-bold transition-colors whitespace-nowrap ${activeTab === 'DESCRIPTION'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Описание
                </button>
                <button
                    onClick={() => setActiveTab('CHAPTERS')}
                    className={`pb-4 text-base font-bold transition-colors whitespace-nowrap relative ${activeTab === 'CHAPTERS'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Главы
                    <span className="absolute -top-1 -right-4 text-[10px] bg-white/10 px-1.5 rounded text-gray-300">
                        {manga.chapters?.length || 0}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('REVIEWS')}
                    className={`pb-4 text-base font-bold transition-colors whitespace-nowrap ${activeTab === 'REVIEWS'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Рецензии
                </button>
                <button
                    onClick={() => setActiveTab('RELATED')}
                    className={`pb-4 text-base font-bold transition-colors whitespace-nowrap ${activeTab === 'RELATED'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Связанное
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* DESCRIPTION */}
            {activeTab === 'DESCRIPTION' && (
                <div className="bg-[#121217] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden animate-in fade-in duration-300">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3 relative z-10">
                        <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-primaryHover rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
                        Сюжет
                    </h3>
                    <div className="relative group">
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap relative z-10">
                            {manga.description}
                        </p>
                    </div>
                </div>
            )}

            {/* CHAPTERS */}
            {activeTab === 'CHAPTERS' && (
                <div className="animate-in fade-in duration-300">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                                Список глав
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64 group/search">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/search:text-primary transition-colors material-symbols-outlined text-[18px]">search</span>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-surface-highlight-dark/50 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary/50 pl-9 pr-3 py-2 transition-all h-9"
                                    placeholder="Поиск главы..."
                                    type="text"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="w-9 h-9 flex items-center justify-center bg-surface-highlight-dark/50 border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Сортировка">
                                    <span className="material-symbols-outlined text-[18px]">sort</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Team Filter (Mock) */}
                    <div className="flex flex-wrap gap-2 mb-6 pb-2 border-b border-white/5">
                        <button className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold shadow-lg shadow-primary/20 transition-all hover:brightness-110">
                            Все команды
                        </button>
                        {/* Mock teams */}
                        <button className="px-3 py-1 rounded-full bg-surface-highlight-dark hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[10px] font-bold transition-all flex items-center gap-1.5 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Default
                        </button>
                    </div>

                    {/* Chapter List */}
                    <div className="space-y-1.5 mb-10">
                        {filteredChapters.length > 0 ? filteredChapters.map((ch: any, idx) => (
                            <Link
                                key={ch.id}
                                href={`/reader/${ch.id}`}
                                className="chapter-row bg-surface-dark border border-white/5 rounded-lg p-2.5 flex items-center gap-3 group cursor-pointer relative overflow-hidden"
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${idx === 0 ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-white/5 group-hover:bg-primary/50 transition-colors'}`}></div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center pl-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                            Глава {ch.number}
                                        </span>
                                        {idx === 0 && (
                                            <span className="px-1 py-[1px] bg-red-500/10 text-red-400 text-[9px] font-bold uppercase rounded border border-red-500/20 leading-none">NEW</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-medium truncate group-hover:text-gray-400 transition-colors w-full">
                                            {ch.title || 'Без названия'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                                    <div className="flex flex-col items-end min-w-[60px]">
                                        <span className={`text-[10px] font-bold leading-tight ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>
                                            {formatTimeAgo(ch.createdAt)}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-white/5"></div>

                                    {/* Mock Group Info since not in DB yet */}
                                    <div className="flex items-center gap-1.5 min-w-[70px]">
                                        <div className="w-4 h-4 rounded-full bg-surface-highlight-dark flex items-center justify-center text-[8px] font-bold text-white border border-white/10">T</div>
                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-300 transition-colors">Team</span>
                                    </div>

                                    <div className="w-px h-6 bg-white/5"></div>

                                    <button className="flex items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors group/like min-w-[40px] justify-end">
                                        <span className="material-symbols-outlined text-[16px] group-hover/like:text-pink-500 group-hover/like:drop-shadow-[0_0_5px_rgba(236,72,153,0.5)] transition-all">
                                            {ch.likes ? 'favorite' : 'favorite_border'}
                                        </span>
                                        <span className="text-[10px] font-bold">{ch.likes || 0}</span>
                                    </button>
                                </div>
                            </Link>
                        )) : (
                            <div className="py-12 text-center text-gray-500">
                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">menu_book</span>
                                <p>Главы не найдены</p>
                            </div>
                        )}
                    </div>

                    {/* Load More Mock */}
                    {filteredChapters.length > 20 && (
                        <div className="p-4 flex justify-center">
                            <button className="px-6 py-2.5 rounded-xl bg-surface-highlight-dark hover:bg-white/5 border border-white/5 text-xs font-bold text-primary hover:text-white uppercase tracking-wider transition-all flex items-center gap-2">
                                Загрузить еще <span className="material-symbols-outlined text-[16px]">expand_more</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'REVIEWS' && (
                <div className="text-center py-12 text-gray-500">
                    <p>Раздел рецензий в разработке</p>
                </div>
            )}

            {activeTab === 'RELATED' && (
                <div className="text-center py-12 text-gray-500">
                    <p>Раздел связанных тайтлов в разработке</p>
                </div>
            )}
        </div>
    );
}
