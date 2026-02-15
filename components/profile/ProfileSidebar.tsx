"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

interface ProfileSidebarProps {
    isOwnProfile?: boolean;
    profileId: string | number;
}

export default function ProfileSidebar({ isOwnProfile = false, profileId }: ProfileSidebarProps) {
    const pathname = usePathname();
    const basePath = `/user/${profileId}`;
    const { isSidebarCollapsed: isCollapsed } = useUserStore();

    // Normalize paths to ensure correct active state matching
    const isActive = (path: string) => {
        // Special case for root profile path - explicit exact match only
        if (path === basePath) {
            return pathname === path;
        }
        // For sub-routes, allow startsWith
        if (pathname === path) return true;
        if (pathname.startsWith(path + '/')) return true;
        return false;
    };

    const linkClass = (path: string) => `flex items-center rounded-xl transition-all duration-300 group overflow-hidden ${isActive(path)
        ? 'bg-primary/10 text-white font-bold'
        : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
        } ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "px-4 py-3 gap-3 w-full"}`;

    const iconClass = (path: string) => `material-symbols-outlined text-[20px] shrink-0 transition-colors duration-300 ${isActive(path) ? 'text-primary' : 'group-hover:text-white'
        }`;

    const textClass = `transition-[opacity,width,transform] duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "w-0 opacity-0 translate-x-4" : "w-auto opacity-100 translate-x-0"
        }`;

    const headerClass = `text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"
        }`;

    return (
        <aside className={`hidden lg:flex flex-col shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"
            }`}>
            <div className="space-y-8">
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3 className={headerClass}>ГЛАВНОЕ</h3>
                    </div>
                    <nav className="space-y-1">
                        <Link href={basePath} className={linkClass(basePath)}>
                            <span className={iconClass(basePath)}>person</span>
                            <span className={textClass}>Профиль</span>
                        </Link>
                        <Link href={`${basePath}/bookmarks`} className={linkClass(`${basePath}/bookmarks`)}>
                            <span className={iconClass(`${basePath}/bookmarks`)}>bookmark</span>
                            <span className={textClass}>Закладки</span>
                        </Link>
                        <Link href={`${basePath}/friends`} className={linkClass(`${basePath}/friends`)}>
                            <span className={iconClass(`${basePath}/friends`)}>group</span>
                            <span className={textClass}>Друзья</span>
                        </Link>
                    </nav>
                </div>
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3 className={headerClass}>ПЕРСОНАЖ</h3>
                    </div>
                    <nav className="space-y-1">
                        <Link href={`${basePath}/inventory`} className={linkClass(`${basePath}/inventory`)}>
                            <span className={iconClass(`${basePath}/inventory`)}>backpack</span>
                            <span className={textClass}>Инвентарь</span>
                        </Link>
                        <Link href={`${basePath}/cards`} className={linkClass(`${basePath}/cards`)}>
                            <span className={iconClass(`${basePath}/cards`)}>playing_cards</span>
                            <span className={textClass}>Карточки</span>
                        </Link>
                        <Link href={`${basePath}/army`} className={linkClass(`${basePath}/army`)}>
                            <span className={iconClass(`${basePath}/army`)}>groups</span>
                            <span className={textClass}>Армия Теней</span>
                        </Link>
                        <Link href={`${basePath}/tower`} className={linkClass(`${basePath}/tower`)}>
                            <span className={iconClass(`${basePath}/tower`)}>castle</span>
                            <span className={textClass}>Башня</span>
                        </Link>
                    </nav>
                </div>
                <div>
                    <div className="h-4 mb-3 px-3 overflow-hidden whitespace-nowrap">
                        <h3 className={headerClass}>ПРОГРЕСС</h3>
                    </div>
                    <nav className="space-y-1">
                        <Link href={`${basePath}/quests`} className={linkClass(`${basePath}/quests`)}>
                            <span className={iconClass(`${basePath}/quests`)}>assignment_turned_in</span>
                            <span className={textClass}>Квесты</span>
                        </Link>
                        <Link href={`${basePath}/achievements`} className={linkClass(`${basePath}/achievements`)}>
                            <span className={iconClass(`${basePath}/achievements`)}>military_tech</span>
                            <span className={textClass}>Достижения</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </aside>
    );
}
