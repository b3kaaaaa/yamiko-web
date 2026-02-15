"use client";
import React from 'react';
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function CatalogHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sort = searchParams.get('sort') || 'popularity';
    const viewMode = 'grid'; // Simplified for now

    const handleSortChange = (newSort: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', newSort);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <React.Fragment>
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-end justify-between w-full border-b border-white/5 pb-4">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Каталог</h1>

                    <div className="relative group mb-1">
                        <button className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-all relative">
                            <span>
                                {sort === 'popularity' ? 'По популярности' :
                                    sort === 'rating' ? 'По рейтингу' :
                                        sort === 'updated_at' ? 'По новизне' : 'По популярности'}
                            </span>
                            <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-highlight-dark border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden flex flex-col">
                            <button onClick={() => handleSortChange('popularity')} className={`px-4 py-2.5 text-sm font-medium flex items-center justify-between text-left ${sort === 'popularity' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                По популярности
                                {sort === 'popularity' && <span className="material-symbols-outlined text-[16px]">check</span>}
                            </button>
                            <button onClick={() => handleSortChange('rating')} className={`px-4 py-2.5 text-sm font-medium flex items-center justify-between text-left ${sort === 'rating' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                По рейтингу
                                {sort === 'rating' && <span className="material-symbols-outlined text-[16px]">check</span>}
                            </button>
                            <button onClick={() => handleSortChange('updated_at')} className={`px-4 py-2.5 text-sm font-medium flex items-center justify-between text-left ${sort === 'updated_at' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                По новизне
                                {sort === 'updated_at' && <span className="material-symbols-outlined text-[16px]">check</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <header className="flex flex-col gap-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Лента:</span>
                        <div className="flex items-center gap-1">
                            {/* Feed toggles could be implemented here as params in future */}
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/50 bg-primary/20 text-primary shadow-[0_0_15px_rgba(168,85,247,0.15)] text-sm font-medium transition-all duration-200">
                                <span className="material-symbols-outlined filled text-[20px]">stars</span>
                                Для вас
                            </button>
                            {/* Placeholders for other feeds */}
                        </div>
                    </div>
                    <div className="flex items-center bg-surface-highlight-dark rounded-lg p-1 border border-white/5">
                        <button className="p-2 rounded-lg bg-surface-highlight-dark text-white shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-[22px]">grid_view</span>
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">view_list</span>
                        </button>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
}
