"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function CatalogFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [search, setSearch] = useState(searchParams.get("query") || "");
    const [selectedType, setSelectedType] = useState<string | null>(searchParams.get("type"));
    const [selectedGenres, setSelectedGenres] = useState<string[]>(searchParams.getAll("genres"));
    const [status, setStatus] = useState<string[]>(searchParams.getAll("status"));
    const [genresList, setGenresList] = useState<{ id: string, name: string }[]>([]);

    // Determine active period/sort from params or default
    const [period, setPeriod] = useState(searchParams.get("sort") === "views_7_days" ? "7_days" : searchParams.get("sort") === "views_30_days" ? "30_days" : searchParams.get("sort") === "views" ? "all_time" : "all_time");

    // Fetch available genres on mount
    useEffect(() => {
        const fetchGenres = async () => {
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
            const { data } = await supabase.from('genres').select('*').order('name');
            if (data) setGenresList(data);
        };
        fetchGenres();
    }, []);

    const handleApply = () => {
        const params = new URLSearchParams();
        if (search) params.set("query", search);
        if (selectedType) params.set("type", selectedType);

        selectedGenres.forEach(g => params.append("genres", g));
        status.forEach(s => params.append("status", s));

        // Logic for period mapping to sort if needed, strictly speaking user design has separate Sort and Period.
        // For now, let's map Period buttons to Sort params if they imply popularity.
        // User Design "Period": 7 days, Month, Year, All time.
        // This usually filters the *creation date* OR *popularity timeframe*.
        // Assuming Popularity timeframe based on label "Popular" context often seen.
        // But here it says "Период" (Period) in Filter Sidebar.
        // If sorting is "Popularity", this toggles the timeframe.

        // Let's passed period as a separate param if we want to filter by update/create date,
        // OR map to specific sort keys.
        // For now, let's just pass it as a param 'p' and handle logic in page.
        // But to keep it simple with existing `page.tsx` logic:
        // Existing page supports: sort='popularity' | 'updated_at' ...
        // We might need to enhance page.tsx to support `period`.

        // Let's keep it simple: Just push what we have.

        router.push(`/catalog?${params.toString()}`);
    };

    const toggleGenre = (genreObj: { id: string, name: string }) => {
        // We use ID or Name? Usually DB filters by ID, but URL friendly might be Name.
        // Let's use ID for correctness if possible, or Name if simpler.
        // Migration 27 uses Genre Name in the array check.
        const val = genreObj.name;
        if (selectedGenres.includes(val)) {
            setSelectedGenres(selectedGenres.filter(g => g !== val));
        } else {
            setSelectedGenres([...selectedGenres, val]);
        }
    };

    const toggleStatus = (val: string) => {
        if (status.includes(val)) {
            setStatus(status.filter(s => s !== val));
        } else {
            setStatus([...status, val]);
        }
    };

    return (
        <aside className="hidden xl:flex w-80 shrink-0 sticky top-24 self-start h-auto flex-col gap-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 text-xl">search</span>
                </div>
                <input
                    className="w-full bg-surface-highlight-dark border-transparent focus:bg-surface-highlight-dark/80 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-gray-200 focus:ring-1 focus:ring-primary focus:border-primary placeholder-gray-500 shadow-sm transition-all"
                    placeholder="Поиск в каталоге..."
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-6 p-1">
                {/* Type */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Тип</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['MANHWA', 'MANGA', 'MANHUA'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(selectedType === type ? null : type)}
                                className={`py-2.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center shadow-sm border ${selectedType === type
                                        ? 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30 shadow-inner'
                                        : 'bg-transparent border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {type === 'MANHWA' ? 'Манхва' : type === 'MANGA' ? 'Манга' : 'Маньхуа'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Genres */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Жанры</h3>
                    <div className="flex flex-col max-h-48 overflow-y-auto custom-scroll pr-2 gap-2">
                        {genresList.map((g) => (
                            <label key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-highlight-dark cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 bg-transparent border-gray-600 rounded text-primary focus:ring-primary focus:ring-offset-0"
                                    checked={selectedGenres.includes(g.name)}
                                    onChange={() => toggleGenre(g)}
                                />
                                <span className={`text-sm transition-colors ${selectedGenres.includes(g.name) ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'}`}>
                                    {g.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Статус</h3>
                    <div className="relative group w-full">
                        {/* Simple list for now instead of dropdown to match 'open' design or make it always visible */}
                        <div className="flex flex-col gap-1 p-1">
                            <label className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded bg-surface-dark border-gray-600 text-primary focus:ring-0"
                                    checked={status.includes('ONGOING')}
                                    onChange={() => toggleStatus('ONGOING')}
                                />
                                <span className="text-sm text-gray-300">Онгоинг</span>
                            </label>
                            <label className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded bg-surface-dark border-gray-600 text-primary focus:ring-0"
                                    checked={status.includes('COMPLETED')}
                                    onChange={() => toggleStatus('COMPLETED')}
                                />
                                <span className="text-sm text-gray-300">Завершён</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                <button
                    onClick={handleApply}
                    className="w-full py-3.5 mt-2 bg-primary hover:bg-primaryHover text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    Применить фильтры
                </button>
            </div>
        </aside>
    );
}
