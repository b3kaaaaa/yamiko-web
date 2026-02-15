'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal() {
    const { isLoginOpen, closeLoginModal, openRegisterModal, setCurrentUser } = useUserStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = browserClient;

    const handleLogin = async (e: React.FormEvent | React.MouseEvent) => {
        // Prevent default if it's a form event, though we use type="button" now
        if (e && 'preventDefault' in e) e.preventDefault();

        console.log("Attempting login...", { email });
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Supabase Login Error:", error);
                throw error;
            }

            console.log("Login successful, session:", !!data.session);

            if (data.session) {
                // Fetch full profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    // Map to User interface if needed, or just us raw profile
                    // Assuming store expects User type which matches profile structure mostly
                    setCurrentUser(profile as any);
                }
                closeLoginModal();
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isLoginOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLoginModal}
                        className="absolute inset-0 bg-background-dark/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[480px] rounded-[2rem] p-10 md:p-12 overflow-hidden bg-[rgba(18,18,23,0.8)] backdrop-blur-xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(168,85,247,0.1)]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeLoginModal}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {/* Decorative Blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-10 flex flex-col items-center group">
                                <span className="text-4xl font-black tracking-tighter text-white uppercase mb-1 drop-shadow-2xl">YAMIKO</span>
                                <div className="h-1 w-12 bg-primary rounded-full group-hover:w-20 transition-all duration-500"></div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">Вход в аккаунт</h1>
                                <p className="text-gray-400 text-sm">Добро пожаловать обратно! Пожалуйста, введите ваши данные.</p>
                            </div>

                            {error && (
                                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">
                                    {error}
                                </div>
                            )}

                            <div className="w-full space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1" htmlFor="email">Email</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">person</span>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                            id="email"
                                            placeholder="example@mail.ru"
                                            type="email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest" htmlFor="password">Пароль</label>
                                        <a className="text-[11px] font-bold text-primary hover:text-primaryHover transition-colors" href="#">Забыли пароль?</a>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock</span>
                                        <input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                            id="password"
                                            placeholder="••••••••"
                                            type="password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-1">
                                    <input className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary focus:ring-offset-background-dark" id="remember" type="checkbox" />
                                    <label className="text-sm text-gray-400 cursor-pointer select-none" htmlFor="remember">Запомнить меня</label>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => handleLogin(e)}
                                    disabled={loading}
                                    className="w-full py-4 bg-primary hover:bg-primaryHover disabled:bg-gray-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] mt-4 flex justify-center items-center"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Войти"
                                    )}
                                </button>
                            </div>

                            <div className="w-full flex items-center gap-4 my-8">
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">или войти через</span>
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                    <span className="text-sm font-semibold text-gray-300">Google</span>
                                </button>
                                <button className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                    <span className="text-sm font-semibold text-gray-300">Discord</span>
                                </button>
                            </div>

                            <p className="mt-10 text-sm text-gray-500">
                                Нет аккаунта?
                                <button
                                    onClick={openRegisterModal}
                                    className="text-primary font-bold hover:text-primaryHover underline underline-offset-4 transition-all ml-1"
                                >
                                    Зарегистрироваться
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
