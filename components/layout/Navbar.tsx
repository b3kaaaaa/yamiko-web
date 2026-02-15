"use client";

import Link from "next/link";
import { useUserStore } from "@/lib/store/userStore";
import { useEffect } from "react";
import SearchModal from "@/components/search/SearchModal";
import ProfileModal from "@/components/profile/ProfileModal";

export default function Navbar() {
    const { currentUser: user, openLoginModal, openRegisterModal, openProfileModal, openSearchModal, toggleSidebar, isLoadingUser } = useUserStore();
    console.log("DEBUG: Navbar Render. Current User:", user);

    return (
        <nav className="sticky top-0 z-50 bg-surface-dark/95 backdrop-blur-xl border-b border-white/5 h-16">
            <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between w-full">
                <SearchModal />
                <div className="flex items-center gap-6 min-w-[240px]">
                    <button
                        onClick={toggleSidebar}
                        className="text-gray-400 hover:text-white transition-all duration-300 p-2 relative group"
                        title="Свернуть меню"
                    >
                        <span className="material-symbols-outlined text-[28px] group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all">menu_open</span>
                    </button>
                    <Link className="flex items-center gap-2 group" href="/">
                        <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-gray-200 transition-colors pl-1">
                            YAMIKO
                        </span>
                    </Link>
                </div>
                <div className="hidden lg:flex items-center justify-center gap-6 flex-1 h-full px-4">
                    {/* Tops Dropdown */}
                    <div className="group relative h-full flex items-center">
                        <button className="flex items-center gap-2 px-3 text-sm font-bold text-gray-400 hover:text-white transition-colors h-full">
                            <span className="material-symbols-outlined text-[20px]">trophy</span>
                            Топы
                            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180">keyboard_arrow_down</span>
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="w-48 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 flex flex-col gap-0.5">
                                <Link href="/rankings/manga" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                                    Манги
                                </Link>
                                <Link href="/rankings/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">group</span>
                                    Пользователи
                                </Link>
                                <Link href="/rankings/guilds" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">diversity_3</span>
                                    Гильдии
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Centered Search Trigger */}
                    <button
                        onClick={openSearchModal}
                        className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl w-full max-w-md text-gray-400 transition-all group mx-4"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">search</span>
                        <span className="text-sm font-medium">Найти мангу, автора или персонажа...</span>
                        <div className="ml-auto flex gap-1">
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">CTRL</span>
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">K</span>
                        </div>
                    </button>

                    {/* Shop Dropdown */}
                    <div className="group relative h-full flex items-center">
                        <button className="flex items-center gap-2 px-3 text-sm font-bold text-gray-400 hover:text-white transition-colors h-full">
                            <span className="material-symbols-outlined text-[20px]">storefront</span>
                            Магазин
                            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180">keyboard_arrow_down</span>
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="w-52 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 flex flex-col gap-0.5">
                                <Link href="/shop/personalization" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">palette</span>
                                    Персонализация
                                </Link>
                                <Link href="/shop/cards" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">style</span>
                                    Карты
                                </Link>
                                <Link href="/shop/cases" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                    Кейсы
                                </Link>
                                <Link href="/shop/market" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">store</span>
                                    Маркет
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 min-w-[240px] justify-end">
                    {user ? (
                        <>


                            <button
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all relative group shadow-none hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                title="Закладки"
                            >
                                <span className="material-symbols-outlined text-[24px] group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                                    bookmark
                                </span>
                            </button>
                            <button
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all relative group shadow-none hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                title="Уведомления"
                            >
                                <span className="material-symbols-outlined text-[24px] group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                                    notifications
                                </span>
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-dark shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></span>
                            </button>

                            {/* Profile Trigger Container (Relative for Dropdown) */}
                            <div className="relative">
                                <div
                                    onClick={openProfileModal}
                                    className="cursor-pointer group hover:bg-white/5 rounded-full transition-all ml-1 p-1"
                                    title="Открыть профиль"
                                >
                                    <div className="h-9 w-9 rounded-full overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-primary/50 transition-all relative flex items-center justify-center bg-[#1C1C22]">
                                        {user.avatar_url ? (
                                            <img
                                                alt="User avatar"
                                                className="h-full w-full object-cover"
                                                src={user.avatar_url}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-white">{user.username?.[0]?.toUpperCase() || "U"}</span>
                                        )}
                                    </div>
                                </div>
                                <ProfileModal />
                            </div>
                        </>
                    ) : (
                        // Show Auth Buttons ONLY if not loading
                        // If loading, show nothing to prevent flash
                        !isLoadingUser && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={openLoginModal}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors border border-white/5"
                                >
                                    Войти
                                </button>
                                <button
                                    onClick={openRegisterModal}
                                    className="px-4 py-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                                >
                                    Регистрация
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div >
        </nav >
    );
}
