"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/userStore";

type BookmarkStatus = 'READING' | 'PLANNED' | 'COMPLETED' | 'DROPPED' | 'FAVORITE';

interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    mangaId: string;
    mangaTitle: string;
    currentStatus?: BookmarkStatus | null;
    onUpdate: (status: BookmarkStatus | null) => void;
}

export default function BookmarkModal({ isOpen, onClose, mangaId, mangaTitle, currentStatus, onUpdate }: BookmarkModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<BookmarkStatus | null>(currentStatus || null);
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState<Record<BookmarkStatus, number>>({
        READING: 0,
        PLANNED: 0,
        COMPLETED: 0,
        DROPPED: 0,
        FAVORITE: 0
    });
    const supabase = createClient();
    const { currentUser } = useUserStore();

    useEffect(() => {
        if (isOpen && currentUser) {
            // Reset selection to current status when opening
            setSelectedStatus(currentStatus || null);

            // Fetch counts
            const fetchCounts = async () => {
                const { data } = await (supabase as any).rpc('get_user_bookmark_counts', { user_uuid: currentUser.id });
                if (data) {
                    const newCounts: any = { ...counts };
                    data.forEach((item: any) => {
                        newCounts[item.status] = item.count;
                    });
                    setCounts(newCounts);
                }
            };
            fetchCounts();
        }
    }, [isOpen, currentUser, currentStatus]);

    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            const response = await fetch('/api/user/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mangaId,
                    status: selectedStatus // If null, API should handle deletion/removal
                }),
            });

            if (response.ok) {
                onUpdate(selectedStatus);
                onClose();
            }
        } catch (error) {
            console.error("Failed to update bookmark", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const statuses: { id: BookmarkStatus; label: string; color: string; count: number }[] = [
        { id: 'READING', label: 'Читаю', color: 'bg-blue-500', count: counts.READING },
        { id: 'PLANNED', label: 'В планах', color: 'bg-orange-500', count: counts.PLANNED },
        { id: 'COMPLETED', label: 'Прочитано', color: 'bg-green-500', count: counts.COMPLETED },
        { id: 'DROPPED', label: 'Брошено', color: 'bg-gray-500', count: counts.DROPPED },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121217] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-xl font-bold text-white mb-1">Добавить в списки</h2>
                <p className="text-sm text-gray-400 mb-6 truncate">{mangaTitle}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {statuses.map((status) => (
                        <button
                            key={status.id}
                            onClick={() => setSelectedStatus(status.id === selectedStatus ? null : status.id)}
                            className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${selectedStatus === status.id
                                ? 'bg-[#1C1C22] border-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : 'bg-[#1C1C22]/50 border-white/5 hover:bg-[#1C1C22] hover:border-white/10'
                                }`}
                        >
                            <div className={`w-1.5 h-6 rounded-full ${status.color} shadow-[0_0_8px_currentColor] mb-2`}></div>
                            <div className="font-bold text-white text-sm group-hover:text-white/90 transition-colors">
                                {status.label}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium">
                                {status.count} тайтлов
                            </div>
                            {selectedStatus === status.id && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Создать новую папку
                </button>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primaryHover text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}
