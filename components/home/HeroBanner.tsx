'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface HeroBannerProps {
    slides: any[];
}

export default function HeroBanner({ slides = [] }: HeroBannerProps) {
    const [currentSetIndex, setCurrentSetIndex] = useState(0);

    // Group slides into sets of 3
    const heroSets = useMemo(() => {
        const sets = [];
        for (let i = 0; i < slides.length; i += 3) {
            // Only create a set if we have at least 1 item
            // Ideally we want 3, but we handles partials if needed
            if (slides[i]) {
                sets.push(slides.slice(i, i + 3));
            }
        }
        return sets;
    }, [slides]);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        if (heroSets.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSetIndex((prev) => (prev + 1) % heroSets.length);
        }, 30000);
        return () => clearInterval(interval);
    }, [heroSets.length]);

    if (!heroSets.length) return null;

    const currentSet = heroSets[currentSetIndex];
    const bigManga = currentSet[0];
    const smallManga1 = currentSet[1];
    const smallManga2 = currentSet[2];

    return (
        <div className="relative w-full h-auto lg:h-[420px] grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Big Banner (Span 8) */}
            <div className="lg:col-span-8 relative h-[400px] lg:h-full rounded-3xl overflow-hidden shadow-2xl group border border-white/5 bg-[#121217]">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={`big-${bigManga.id}`}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        {/* Background Image */}
                        {bigManga.cover_url ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                                style={{ backgroundImage: `url(${bigManga.cover_url})` }}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0E] via-[#0B0B0E]/40 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Content */}
                <div className="absolute bottom-0 left-0 p-8 w-full max-w-3xl z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-big-${bigManga.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-primary/20 text-primary border border-primary/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                    {bigManga.status === 'ONGOING' ? 'Онгоинг' : 'Новый хит'}
                                </span>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <span className="material-symbols-outlined text-[16px] filled">star</span>
                                    <span className="text-xs font-bold text-white">{bigManga.rating || 'N/A'}</span>
                                </div>
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-black text-white mb-3 leading-[1.1] tracking-tight drop-shadow-xl line-clamp-2">
                                {bigManga.title}
                            </h1>

                            <p className="text-gray-300 text-sm lg:text-base leading-relaxed line-clamp-2 max-w-xl mb-6 text-shadow-sm">
                                {bigManga.description || 'Описание отсутствует...'}
                            </p>

                            <Link
                                href={`/manga/${bigManga.slug}`}
                                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-gray-200 transition-all shadow-lg shadow-white/5 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px] filled">menu_book</span>
                                Читать
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Column: 2 Small Banners (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">

                {/* Top Small Banner */}
                {smallManga1 && (
                    <motion.div
                        key={`small1-${smallManga1.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex-1 relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-[#121217]"
                    >
                        <Link href={`/manga/${smallManga1.slug}`} className="block w-full h-full relative">
                            {/* Background */}
                            <div className="absolute inset-0">
                                {smallManga1.cover_url ? (
                                    <img
                                        src={smallManga1.cover_url}
                                        alt={smallManga1.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/20 to-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-5 z-10 w-full">
                                <h3 className="font-bold text-lg text-white mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                    {smallManga1.title}
                                </h3>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                        {Math.floor((smallManga1.views || 0) / 1000)}k
                                    </span>
                                    <span>•</span>
                                    <span>{smallManga1.genres?.[0] || 'Манга'}</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Bottom Small Banner */}
                {smallManga2 && (
                    <motion.div
                        key={`small2-${smallManga2.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex-1 relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-[#121217]"
                    >
                        <Link href={`/manga/${smallManga2.slug}`} className="block w-full h-full relative">
                            {/* Background */}
                            <div className="absolute inset-0">
                                {smallManga2.cover_url ? (
                                    <img
                                        src={smallManga2.cover_url}
                                        alt={smallManga2.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/20 to-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-5 z-10 w-full">
                                <h3 className="font-bold text-lg text-white mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                    {smallManga2.title}
                                </h3>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                        {Math.floor((smallManga2.views || 0) / 1000)}k
                                    </span>
                                    <span>•</span>
                                    <span>{smallManga2.genres?.[0] || 'Манга'}</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Pagination Dots (inside right column container or absolute) */}
                <div className="absolute -bottom-8 left-0 lg:left-0 flex items-center gap-2">
                    {heroSets.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSetIndex(idx)}
                            className={`transition-all duration-300 rounded-full ${idx === currentSetIndex
                                ? "w-8 h-2 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                : "w-2 h-2 bg-white/20 hover:bg-white/40"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
