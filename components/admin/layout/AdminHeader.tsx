"use client";

import { usePathname } from "next/navigation";

export default function AdminHeader() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    return (
        <header className="h-16 bg-[#121217]/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-gray-500 text-[20px]">home</span>
                {segments.map((segment, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-600">/</span>
                        <span className={`capitalize ${index === segments.length - 1 ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {segment}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search (ID, User, Title)..."
                        className="bg-[#1A1A23] border border-white/5 rounded-lg py-1.5 pl-3 pr-10 text-sm text-gray-300 focus:ring-1 focus:ring-primary focus:border-primary w-64 placeholder-gray-600 transition-all group-hover:bg-[#20202A]"
                    />
                    <span className="material-symbols-outlined absolute right-2 top-1.5 text-gray-500 text-[18px]">search</span>
                </div>

                <button className="relative text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#121217]"></span>
                </button>

                <button className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                </button>
            </div>
        </header>
    );
}
