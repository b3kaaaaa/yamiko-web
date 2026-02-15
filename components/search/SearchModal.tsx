'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface MangaResult {
    title: string;
    slug: string;
    coverImage: string;
    rating: number;
    releaseYear?: number;
    status: string;
    type?: string;
}

export default function SearchModal() {
    const { isSearchOpen, closeSearchModal } = useUserStore();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('manga'); // manga, user, guild, character, studio
    const [mounted, setMounted] = useState(false);
    const [results, setResults] = useState<MangaResult[]>([]);
    const [popularManga, setPopularManga] = useState<MangaResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        // Load recent searches
        const saved = localStorage.getItem('yamiko_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));

        // Fetch Popular Manga
        const fetchPopular = async () => {
            try {
                const res = await fetch('/api/search?type=popular');
                const data = await res.json();
                if (data.results) setPopularManga(data.results);
            } catch (err) {
                console.error("Failed to fetch popular manga", err);
            }
        };
        fetchPopular();
    }, []);

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=${category}`);
                    const data = await res.json();
                    setResults(data.results || []);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query, category]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeSearchModal();
        };
        if (isSearchOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isSearchOpen, closeSearchModal]);

    // Lock body scroll
    useEffect(() => {
        if (isSearchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery(''); // Clear query on close
        }
    }, [isSearchOpen]);

    const handleSearchSelect = (item: MangaResult) => {
        saveRecentSearch(query || item.title);
        closeSearchModal();

        // Navigation logic based on category/type
        if (category === 'user' || item.type === 'USER') {
            // router.push(`/user/${item.slug}`); 
            // Alert for demo purposes as user pages might not exist yet
            alert(`Navigate to user: ${item.slug}`);
        } else if (category === 'guild' || item.type === 'GUILD') {
            // router.push(`/guild/${item.slug}`);
            alert(`Navigate to guild: ${item.slug}`);
        } else {
            router.push(`/manga/${item.slug}`);
        }
    };

    const saveRecentSearch = (term: string) => {
        if (!term.trim()) return;
        const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('yamiko_recent_searches', JSON.stringify(newRecent));
    };

    const removeRecent = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(s => s !== term);
        setRecentSearches(newRecent);
        localStorage.setItem('yamiko_recent_searches', JSON.stringify(newRecent));
    }

    const clearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('yamiko_recent_searches');
    }

    const categories = [
        { id: 'manga', label: 'Манга' },
        { id: 'user', label: 'Пользователь' },
        { id: 'guild', label: 'Гильдия' },
        { id: 'character', label: 'Персонаж' },
        { id: 'studio', label: 'Студия' },
    ];


    if (!isSearchOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSearchModal}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-2xl bg-[#0B0B0E] rounded-2xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto relative z-[101]"
                    >
                        {/* Search Header */}
                        <div className="p-6 border-b border-white/5 bg-[#121217]">
                            <div className="relative flex items-center group mb-4">
                                <span className="material-symbols-outlined absolute left-4 text-gray-400 text-2xl group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-[#1C1C22] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-lg font-medium text-white focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-500 shadow-inner transition-all outline-none"
                                    placeholder={`Искать ${categories.find(c => c.id === category)?.label.toLowerCase()}...`}
                                    type="text"
                                />
                                <button
                                    onClick={closeSearchModal}
                                    className="absolute right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${category === cat.id
                                                ? "bg-primary/20 border-primary text-primary font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                : "bg-[#1C1C22] border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#18181B]">
                            {/* RESULTS VIEW */}
                            {query.length > 1 ? (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        {isLoading ? 'Поиск...' : `Результаты: ${results.length}`}
                                    </h3>
                                    <div className="space-y-2">
                                        {results.length > 0 ? (
                                            results.map((item) => (
                                                <div
                                                    key={item.slug + item.title}
                                                    onClick={() => handleSearchSelect(item)}
                                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-white/5"
                                                >
                                                    <div className={`rounded-lg bg-gray-800 shrink-0 overflow-hidden relative shadow-md ${category === 'user' ? 'w-12 h-12 rounded-full' : 'w-10 h-14'}`}>
                                                        {item.coverImage ? (
                                                            <img src={item.coverImage} className="w-full h-full object-cover" alt={item.title} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white/5">
                                                                <span className="material-symbols-outlined text-sm">image_not_supported</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-200 group-hover:text-primary transition-colors">{item.title}</h4>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold mt-1">
                                                            {category === 'manga' && (
                                                                <>
                                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                                        <span className="material-symbols-outlined text-[12px] filled">star</span> {item.rating}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                                    <span>{item.releaseYear || 'N/A'}</span>
                                                                </>
                                                            )}
                                                            <span className={item.status === 'ONGOING' ? 'text-green-400' : 'text-blue-400'}>
                                                                {item.status === 'ONGOING' ? 'Онгоинг' : item.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            !isLoading && <div className="text-center text-gray-500 py-8 text-sm">Ничего не найдено...</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Recent Queries */}
                                    {recentSearches.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-1">Недавние запросы</h3>
                                            <div className="space-y-1">
                                                {recentSearches.map((item) => (
                                                    <div
                                                        key={item}
                                                        onClick={() => { setQuery(item); }}
                                                        className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                                            <span className="material-symbols-outlined text-gray-600 text-[18px]">history</span>
                                                            <span>{item}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => removeRecent(item, e)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Popular / Often Searched */}
                                    <div className="mt-8">
                                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-1">Часто ищут</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {popularManga.map((manga) => (
                                                <button
                                                    key={manga.slug}
                                                    onClick={() => handleSearchSelect(manga)}
                                                    className="px-3 py-1.5 rounded-lg bg-surface-highlight-dark hover:bg-primary/20 hover:text-primary text-gray-400 text-xs font-bold transition-all border border-white/5 truncate max-w-[200px]"
                                                >
                                                    #{manga.title}
                                                </button>
                                            ))}
                                            {popularManga.length === 0 && (
                                                <div className="text-gray-500 text-xs italic">Загрузка...</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
