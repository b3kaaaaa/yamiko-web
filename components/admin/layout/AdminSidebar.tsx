"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { browserClient as supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <aside className="w-64 flex-shrink-0 bg-[#0B0B0E] border-r border-white/5 flex flex-col h-full z-20 backdrop-blur-xl bg-opacity-80">
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <span className="text-xl font-black tracking-tighter text-white uppercase">
                    <span className="text-primary">YAMIKO</span> ADMIN
                </span>
            </div>

            <div className="flex-grow overflow-y-auto py-6 space-y-8 custom-scrollbar">
                {/* GLOBAL */}
                <div>
                    <h3 className="px-6 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Глобальное</h3>
                    <nav className="flex flex-col">
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin') && pathname === '/admin' ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            Обзор
                        </Link>
                        <Link
                            href="/admin/analytics"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/analytics') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">analytics</span>
                            Аналитика
                        </Link>
                        <Link
                            href="/admin/logs"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/logs') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">terminal</span>
                            Логи
                        </Link>
                    </nav>
                </div>

                {/* CONTENT */}
                <div>
                    <h3 className="px-6 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Контент</h3>
                    <nav className="flex flex-col">
                        <Link
                            href="/admin/manga"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/manga') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">book_2</span>
                            Манга
                        </Link>
                        <Link
                            href="/admin/chapters"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/chapters') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">library_books</span>
                            Главы
                            {/* <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">12</span> */}
                        </Link>
                        <Link
                            href="/admin/parser"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/parser') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                            Парсер
                        </Link>
                        <Link
                            href="/admin/fandom"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/fandom') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">interests</span>
                            Фандом
                        </Link>
                    </nav>
                </div>

                {/* USERS */}
                <div>
                    <h3 className="px-6 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Юзеры</h3>
                    <nav className="flex flex-col">
                        <Link
                            href="/admin/users"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/users') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">group</span>
                            Профили
                        </Link>
                        <Link
                            href="/admin/quests"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/quests') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">swords</span>
                            Квесты
                        </Link>
                        <Link
                            href="/admin/achievements"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/achievements') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">trophy</span>
                            Достижения
                        </Link>
                    </nav>
                </div>

                {/* ECONOMY */}
                <div>
                    <h3 className="px-6 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Экономика</h3>
                    <nav className="flex flex-col">
                        <Link
                            href="/admin/shop"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/shop') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">storefront</span>
                            Магазин
                        </Link>
                        <Link
                            href="/admin/transactions"
                            className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-r-2 ${isActive('/admin/transactions') ? 'bg-primary/10 text-white border-primary' : 'text-gray-400 hover:text-white border-transparent'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                            Транзакции
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 bg-[#121217] p-2 rounded-lg border border-white/5">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-[10px]">AD</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121217]"></div>
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">System Admin</div>
                        <div className="text-[9px] text-primary uppercase tracking-wider font-bold">God Mode</div>
                    </div>
                    <button onClick={handleLogout} className="ml-auto text-gray-500 hover:text-white transition-colors" title="Logout">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
