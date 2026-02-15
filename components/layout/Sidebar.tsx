"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUserStore } from "@/lib/store/userStore";

export default function Sidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed: isCollapsed } = useUserStore();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <aside
            className={`hidden xl:flex flex-col shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"
                }`}
        >
            <div className="space-y-8">
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3
                            className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"
                                }`}
                        >
                            НАВИГАЦИЯ
                        </h3>
                    </div>
                    <nav className="space-y-1">
                        {[
                            { icon: "home", text: "Главная", href: "/" },
                            { icon: "grid_view", text: "Каталог", href: "/catalog" },
                            { icon: "new_releases", text: "Новое", href: "/latest" },
                            { icon: "local_fire_department", text: "Популярное", href: "/popular" },
                            { icon: "schedule", text: "История", href: "/history" },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                className={`flex items-center rounded-xl transition-all duration-300 group overflow-hidden ${isActive(item.href)
                                    ? "bg-primary/10 text-white font-bold"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white font-medium"
                                    } ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "px-4 py-3 gap-3 w-full"}`}
                                href={item.href}
                            >
                                <span
                                    className={`material-symbols-outlined text-[20px] shrink-0 transition-colors duration-300 ${isActive(item.href) ? "text-primary" : "group-hover:text-white"
                                        }`}
                                >
                                    {item.icon}
                                </span>
                                <span
                                    className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"
                                        }`}
                                >
                                    {item.text}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3
                            className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"
                                }`}
                        >
                            ИССЛЕДОВАТЬ
                        </h3>
                    </div>
                    <nav className="space-y-1">
                        {[
                            { icon: "group", text: "Комьюнити", href: "/community" },
                            { icon: "shield", text: "Гильдии", href: "/guilds" },
                            { icon: "auto_awesome", text: "Фандом", href: "/fandom" },
                            { icon: "forum", text: "Форум", href: "/forum" },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                className={`flex items-center rounded-xl transition-all duration-300 group overflow-hidden ${isActive(item.href)
                                    ? "bg-primary/10 text-white font-bold"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white font-medium"
                                    } ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "px-4 py-3 gap-3 w-full"}`}
                                href={item.href}
                            >
                                <span className="material-symbols-outlined text-[20px] shrink-0 group-hover:text-white transition-colors duration-300">
                                    {item.icon}
                                </span>
                                <span
                                    className={`transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"
                                        }`}
                                >
                                    {item.text}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className={`mt-auto transition-all duration-300 ${isCollapsed ? "px-0" : "px-3"}`} />
            </div>
        </aside>
    );
}
