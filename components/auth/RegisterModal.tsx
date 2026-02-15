'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterModal() {
    const { isRegisterOpen, closeRegisterModal, openLoginModal, setCurrentUser } = useUserStore();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = browserClient;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            setLoading(false);
            return;
        }

        try {
            // Call API implementation
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }

            // Success - Auto Login logic
            // The API created the user and profile. 
            // Now we sign in the user on the client side to establish a session.
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // Even if auto-login fails, registration was successful.
                // Maybe show a message "Account created, please login".
                setError('Аккаунт создан, но автоматический вход не удался. Пожалуйста, войдите вручную.');
                setLoading(false);
                // We could close existing modal and open login?
                return;
            }

            if (signInData.user) {
                // Fetch profile to update store
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', signInData.user.id)
                    .single();

                if (profile) {
                    setCurrentUser(profile as any);
                }
                closeRegisterModal();
            }

        } catch (err: any) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isRegisterOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeRegisterModal}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md rounded-3xl p-10 overflow-hidden bg-[rgba(18,18,23,0.8)] border border-white/10 shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeRegisterModal}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 text-center mb-8">
                            <div className="inline-block mb-6">
                                <span className="text-3xl font-black tracking-tighter text-white uppercase italic">YAMIKO</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Создать аккаунт</h1>
                            <p className="text-gray-400 text-sm">Присоединяйтесь к сообществу ценителей манги</p>
                        </div>

                        {error && (
                            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-4 text-center z-10 relative">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5 relative z-10" onSubmit={handleRegister}>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Имя пользователя</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">person</span>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="Ваш никнейм"
                                        type="text"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">mail</span>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="example@mail.com"
                                        type="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Пароль</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock</span>
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        type="password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Подтвердите пароль</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock_reset</span>
                                    <input
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        type="password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-4 bg-primary hover:bg-primaryHover disabled:bg-gray-600 text-white font-bold rounded-xl transition-all text-sm mt-2 flex justify-center items-center"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Создать аккаунт"
                                )}
                            </button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-gray-500 font-bold tracking-widest">Или через</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-colors">
                                    <span className="text-gray-300">Google</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-colors">
                                    <span className="text-gray-300">Discord</span>
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center relative z-10">
                            <p className="text-sm text-gray-500">
                                Уже есть аккаунт?
                                <button
                                    onClick={openLoginModal}
                                    className="text-white font-bold hover:text-primary transition-colors ml-1"
                                >
                                    Войти
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
