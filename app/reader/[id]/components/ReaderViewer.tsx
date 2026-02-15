"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ReaderViewerProps {
    chapter: any;
    manga: any;
    navigation: {
        prev: any;
        next: any;
        all: any[];
    };
}

export default function ReaderViewer({ chapter, manga, navigation }: ReaderViewerProps) {
    const router = useRouter();
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && navigation.prev) {
                router.push(`/reader/${navigation.prev.id}`);
            } else if (e.key === 'ArrowRight' && navigation.next) {
                router.push(`/reader/${navigation.next.id}`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigation, router]);

    // Sync Reading Progress
    const supabase = createClient();
    useEffect(() => {
        const syncProgress = async () => {
            if (chapter?.id && manga?.id) {
                await (supabase.rpc as any)('sync_reading_progress', {
                    p_manga_id: manga.id,
                    p_chapter_id: chapter.id,
                    p_page_number: 1, // Start at page 1
                    p_total_pages: chapter.pages?.length || 0
                });
            }
        };
        syncProgress();
    }, [chapter?.id, manga?.id]);

    // Hide header on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowHeader(false);
            } else {
                setShowHeader(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const chapterId = e.target.value;
        if (chapterId) {
            router.push(`/reader/${chapterId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0E] text-gray-200">
            {/* Sticky Header */}
            <header className={`fixed top-0 left-0 right-0 h-16 bg-[#121217]/95 backdrop-blur-xl border-b border-white/5 z-50 transition-transform duration-300 flex items-center justify-between px-4 lg:px-8 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex items-center gap-4">
                    <Link href={`/manga/${manga.id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="hidden md:inline font-bold text-sm">К тайтлу</span>
                    </Link>
                    <div className="w-px h-6 bg-white/10 hidden md:block"></div>
                    <h1 className="font-bold text-white truncate max-w-[200px] md:max-w-md">
                        {manga.title}
                        <span className="text-gray-500 font-normal ml-2 text-sm">Глава {chapter.number}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Chapter Select */}
                    <div className="relative hidden md:block">
                        <select
                            className="bg-surface-highlight-dark border border-white/10 text-white text-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-primary focus:border-primary appearance-none cursor-pointer min-w-[140px]"
                            value={chapter.id}
                            onChange={handleChapterChange}
                        >
                            {navigation.all.map((ch) => (
                                <option key={ch.id} value={ch.id}>
                                    Глава {ch.chapter_number}
                                </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            href={navigation.prev ? `/reader/${navigation.prev.id}` : '#'}
                            className={`p-2 rounded-lg transition-colors ${navigation.prev ? 'text-white hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </Link>
                        <Link
                            href={navigation.next ? `/reader/${navigation.next.id}` : '#'}
                            className={`p-2 rounded-lg transition-colors ${navigation.next ? 'text-white hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content (Images) */}
            <main className="pt-20 pb-32 max-w-4xl mx-auto px-0 md:px-4">
                <div className="flex flex-col gap-0 md:gap-2">
                    {chapter.pages && chapter.pages.length > 0 ? (
                        chapter.pages.map((url: string, index: number) => (
                            <div key={index} className="relative w-full">
                                <img
                                    src={url}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-auto md:rounded-lg shadow-2xl bg-[#121217] min-h-[400px] object-contain"
                                    loading="lazy"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[10px] text-gray-400 opacity-60 font-mono">
                                    {index + 1}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-4">broken_image</span>
                            <p>Странцы не найдены</p>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="mt-12 flex justify-center gap-4 px-4">
                    {navigation.prev && (
                        <Link
                            href={`/reader/${navigation.prev.id}`}
                            className="flex-1 max-w-[200px] py-4 rounded-xl bg-[#121217] border border-white/5 hover:border-primary/50 text-center font-bold text-gray-300 hover:text-primary transition-all group"
                        >
                            <div className="text-xs text-gray-500 mb-1 group-hover:text-primary/70">Предыдущая</div>
                            <div>Глава {navigation.prev.chapter_number}</div>
                        </Link>
                    )}
                    {navigation.next ? (
                        <Link
                            href={`/reader/${navigation.next.id}`}
                            className="flex-1 max-w-[200px] py-4 rounded-xl bg-primary hover:bg-primaryHover text-center font-bold text-white transition-all shadow-lg shadow-primary/20"
                        >
                            <div className="text-xs text-white/70 mb-1">Следующая</div>
                            <div>Глава {navigation.next.chapter_number}</div>
                        </Link>
                    ) : (
                        <div className="flex-1 max-w-[200px] py-4 rounded-xl bg-[#121217] border border-white/5 text-center font-bold text-gray-600 cursor-not-allowed">
                            <div className="text-xs text-gray-700 mb-1">Конец</div>
                            <div>Последняя глава</div>
                        </div>
                    )}
                </div>

                {/* Comments / Discussion placeholder could go here */}
            </main>
        </div>
    );
}
