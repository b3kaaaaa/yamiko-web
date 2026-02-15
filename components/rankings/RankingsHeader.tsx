"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RankingsHeader() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="flex flex-col gap-6 pb-6 border-b border-white/5 relative">
            <div className="absolute -bottom-[1px] left-0 w-48 h-[1px] bg-gradient-to-r from-primary to-transparent"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <h1 className="text-3xl font-black text-white tracking-tight shrink-0">Рейтинги</h1>
                <nav className="flex items-center gap-2 p-1 bg-surface-highlight-dark/50 rounded-full border border-white/5">
                    <Link href="/rankings/manga">
                        <button className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 border border-transparent ${isActive('/rankings/manga') ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Манги
                        </button>
                    </Link>
                    <Link href="/rankings/users">
                        <button className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 border border-transparent ${isActive('/rankings/users') ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Читатели
                        </button>
                    </Link>
                    <Link href="/rankings/guilds">
                        <button className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 border border-transparent ${isActive('/rankings/guilds') ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Гильдии
                        </button>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
