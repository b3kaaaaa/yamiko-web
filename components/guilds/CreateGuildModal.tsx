'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useUserStore } from '@/lib/store/userStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface CreateGuildModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGuildModal({ isOpen, onClose }: CreateGuildModalProps) {
    const { currentUser, fetchCurrentUser } = useUserStore();
    const router = useRouter();
    const [name, setName] = useState('');
    const [tag, setTag] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!currentUser) throw new Error('You must be logged in');
            if (currentUser.level < 10) throw new Error('Requires Level 10');
            if (currentUser.rubies < 1000) throw new Error('Insufficient Rubies (1000 required)');

            const { data, error } = await supabase.rpc('create_guild', {
                p_name: name,
                p_tag: tag.toUpperCase(),
                p_description: description,
                p_founder_id: currentUser.id
            });

            if (error) throw error;

            // Success!
            await fetchCurrentUser(); // Refresh user state (rubies deduced)
            onClose();
            router.push(`/guilds/${data}`); // Redirect to new guild

        } catch (err: any) {
            setError(err.message || 'Failed to create guild');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[500px] rounded-[2rem] p-8 md:p-10 overflow-hidden bg-[#121217] border border-white/10 shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                                Создать Гильдию
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Станьте лидером и приведите своих соратников к славе.
                            </p>

                            {error && (
                                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleCreate}>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Название Гильдии</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                        placeholder="Shadow Monarchs"
                                        maxLength={30}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Тег (2-5 букв)</label>
                                    <input
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value.toUpperCase())}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-mono tracking-wider"
                                        placeholder="SUNG"
                                        maxLength={5}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Описание</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none resize-none h-24"
                                        placeholder="Кратко о целях вашей гильдии..."
                                    />
                                </div>

                                {/* Cost Display */}
                                <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10">
                                    <span className="text-sm font-bold text-gray-400">Стоимость создания</span>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-500 text-[20px] filled">diamond</span>
                                        <span className={`text-lg font-black ${currentUser && currentUser.rubies >= 1000 ? 'text-white' : 'text-red-500'}`}>
                                            1,000
                                        </span>
                                    </div>
                                </div>

                                <button
                                    disabled={loading || !currentUser || currentUser.rubies < 1000}
                                    className="w-full py-4 bg-primary hover:bg-primaryHover disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">add_circle</span>
                                            Создать Гильдию
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
