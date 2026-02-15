'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { createBrowserClient } from '@supabase/ssr';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProfileModal() {
    const { currentUser, isProfileOpen, closeProfileModal, setCurrentUser, fetchCurrentUser } = useUserStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Rehydrate/Refresh data when modal opens
    useEffect(() => {
        if (isProfileOpen) {
            fetchCurrentUser();
        }
    }, [isProfileOpen, fetchCurrentUser]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await supabase.auth.signOut();
            setCurrentUser(null);
            closeProfileModal();
            window.location.href = '/'; // Hard redirect to clear any client state
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };



    // Derived values
    const level = currentUser?.level || 1;
    // Simple placeholder for max exp logic. 
    // In a real RPG, this would be a formula like: base * (level ^ exponent)
    // For now, matching the screenshot's scale roughly or using a fixed value.
    const maxExp = 10000;
    const currentExp = currentUser?.exp || 0;
    const expPercentage = Math.min((currentExp / maxExp) * 100, 100);

    // Close on click outside (since we removed the backdrop)
    useEffect(() => {
        if (!isProfileOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            // If click target is not close to the profile modal (simplified check)
            // Ideally we'd use a ref, but for now relying on the fact that if this 
            // component renders, it's the specific dropdown. 
            // We'll fix this properly by using a transparent fixed overlay instead.
        };

        // document.addEventListener('mousedown', handleClickOutside);
        // return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    return (
        <AnimatePresence>
            {isProfileOpen && (
                <>
                    {/* Invisible Backdrop for Click Outside */}
                    <div
                        className="fixed inset-0 z-[40]"
                        onClick={closeProfileModal}
                    />

                    {/* Dropdown Content */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 z-[50] w-[300px] bg-[#121217] border border-white/10 shadow-2xl shadow-black rounded-2xl overflow-hidden origin-top-right"
                    >
                        {/* Ambient Glow inside Modal - Reduced intensity */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>

                        <div className="p-4 relative z-10">
                            {/* Profile Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full p-0.5 bg-gradient-to-tr from-primary to-pink-500 shadow-lg">
                                        <div className="h-full w-full rounded-full overflow-hidden border border-surface-dark bg-surface-dark">
                                            {currentUser?.avatar_url ? (
                                                <img
                                                    alt={currentUser.username}
                                                    className="h-full w-full object-cover"
                                                    src={currentUser.avatar_url}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-surface-highlight-dark text-white font-bold text-lg">
                                                    {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-surface-dark"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm font-bold text-white truncate">
                                        {currentUser?.username || 'Guest'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">
                                            LVL {level}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* EXP Bar */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-text-muted-dark">Опыт</span>
                                    <span className="text-gray-300">{currentExp.toLocaleString()} / {maxExp.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-500 ease-out"
                                        style={{ width: `${expPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Resources Grid - Compact */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {/* Energy */}
                                <div className="bg-white/5 rounded-xl p-2 border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="material-symbols-outlined text-yellow-400 text-sm filled">bolt</span>
                                        <span className="text-[10px] font-bold text-text-muted-dark uppercase">Энергия</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{currentUser?.energy || 0}</span>
                                </div>
                                {/* Rubies */}
                                <div className="bg-white/5 rounded-xl p-2 border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="material-symbols-outlined text-red-500 text-sm">diamond</span>
                                        <span className="text-[10px] font-bold text-text-muted-dark uppercase">Рубины</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{currentUser?.rubies || 0}</span>
                                </div>
                            </div>

                            {/* Menu Links - Compact */}
                            <div className="space-y-0.5 mb-4">
                                <Link
                                    href={currentUser?.display_id ? `/user/${currentUser.display_id}` : '/'}
                                    onClick={closeProfileModal}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-400 hover:text-white group"
                                >
                                    <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">person</span>
                                    <span className="text-xs font-semibold">Мой профиль</span>
                                </Link>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-400 hover:text-white group" href="#">
                                    <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">task_alt</span>
                                    <span className="text-xs font-semibold">Квесты</span>
                                    {/* Badge */}
                                    <span className="ml-auto min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white">2</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-400 hover:text-white group" href="#">
                                    <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">inventory_2</span>
                                    <span className="text-xs font-semibold">Инвентарь</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-400 hover:text-white group" href="#">
                                    <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">diversity_3</span>
                                    <span className="text-xs font-semibold">Мои гильдии</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-gray-400 hover:text-white group" href="#">
                                    <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">settings</span>
                                    <span className="text-xs font-semibold">Настройки</span>
                                </a>
                            </div>

                            {/* Premium Button - Compact */}
                            <div className="mb-3">
                                <button className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 group hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all bg-gradient-to-r from-primary to-pink-600">
                                    <span className="material-symbols-outlined text-white text-[16px]">workspace_premium</span>
                                    <span className="text-[10px] font-black text-white tracking-widest uppercase">PREMIUM</span>
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="pt-2 border-t border-white/5 text-center">
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="text-[10px] font-bold text-gray-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 mx-auto uppercase tracking-wider w-full py-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">logout</span>
                                    {isLoggingOut ? '...' : 'Выйти'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
