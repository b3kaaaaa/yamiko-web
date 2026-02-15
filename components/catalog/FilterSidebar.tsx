'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function FilterSidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Helper to update URL params
    const updateParam = useCallback((name: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        router.push(pathname + '?' + params.toString());
    }, [searchParams, pathname, router]);

    return (
        <aside className="hidden xl:flex flex-col w-[300px] shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            <div className="space-y-4 pr-1">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
                        Фильтры
                    </h2>
                    <button
                        onClick={() => router.push(pathname)}
                        className="text-xs text-text-muted-dark hover:text-white transition-colors font-medium hover:underline"
                    >
                        Сбросить всё
                    </button>
                </div>

                {/* Sort */}
                <div className="bg-surface-dark border border-white/5 rounded-xl p-3 shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Сортировка</h3>
                    <div className="relative">
                        <select
                            className="w-full bg-surface-highlight-dark border border-white/10 rounded-lg text-xs text-white px-3 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:bg-white/5 transition-colors font-medium"
                            onChange={(e) => updateParam('sort', e.target.value)}
                            value={searchParams.get('sort') || 'popularity'}
                        >
                            <option value="popularity">По популярности</option>
                            <option value="updated_at">По дате обновления</option>
                            <option value="created_at">По дате добавления</option>
                            <option value="rating">По рейтингу</option>
                            {/* <option value="chapters_count">По количеству глав</option> */}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-[18px]">expand_more</span>
                    </div>
                </div>

                {/* Type */}
                <div className="bg-surface-dark border border-white/5 rounded-xl p-3 shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Тип</h3>
                    <div className="space-y-2">
                        {['Manhwa', 'Manga', 'Manhua', 'Rumanga'].map((type) => (
                            <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-600 bg-surface-highlight-dark text-primary focus:ring-primary custom-checkbox transition-all"
                                    checked={searchParams.getAll('type').includes(type)}
                                    onChange={(e) => {
                                        const current = searchParams.getAll('type');
                                        let next;
                                        if (e.target.checked) {
                                            next = [...current, type];
                                        } else {
                                            next = current.filter(t => t !== type);
                                        }
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.delete('type');
                                        next.forEach(v => params.append('type', v));
                                        router.push(pathname + '?' + params.toString());
                                    }}
                                />
                                <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">
                                    {type === 'Manhwa' ? 'Манхва' : type === 'Manga' ? 'Манга' : type === 'Manhua' ? 'Маньхуа' : 'Руманга'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="bg-surface-dark border border-white/5 rounded-xl p-3 shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Статус</h3>
                    <div className="space-y-2">
                        {['ONGOING', 'COMPLETED', 'FROZEN'].map((status) => (
                            <label key={status} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-600 bg-surface-highlight-dark text-primary focus:ring-primary custom-checkbox transition-all"
                                    checked={searchParams.getAll('status').includes(status)}
                                    onChange={(e) => {
                                        const current = searchParams.getAll('status');
                                        let next;
                                        if (e.target.checked) {
                                            next = [...current, status];
                                        } else {
                                            next = current.filter(s => s !== status);
                                        }
                                        // Handle multi-value param manually since URLSearchParams set overrides
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.delete('status');
                                        next.forEach(v => params.append('status', v));
                                        router.push(pathname + '?' + params.toString());
                                    }}
                                />
                                <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">
                                    {status === 'ONGOING' ? 'Продолжается' : status === 'COMPLETED' ? 'Завершен' : 'Заморожен'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Categories / Genres (Mocked for now as we don't have dynamic genres fully populated) */}
                <div className="bg-surface-dark border border-white/5 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Жанры</h3>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-hidden relative">
                        {/* We can hardcode some top genres or fetch them. Hardcoding for now based on user HTML */}
                        {['Action', 'Fantasy', 'Romance', 'Drama', 'Adventure', 'Comedy'].map((genre) => (
                            <label key={genre} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-600 bg-surface-highlight-dark text-primary focus:ring-primary custom-checkbox transition-all"
                                    // Simple check for demo
                                    checked={false}
                                    onChange={() => { }}
                                />
                                <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">{genre}</span>
                            </label>
                        ))}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-dark to-transparent pointer-events-none"></div>
                    </div>
                </div>

                <button className="w-full py-3 bg-primary hover:bg-primaryHover rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide mt-2">
                    <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                    Применить
                </button>

            </div>
        </aside>
    );
}
