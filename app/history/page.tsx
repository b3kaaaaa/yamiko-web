"use client";

import PageLayout from "@/components/layout/PageLayout";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { browserClient as supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [popular, setPopular] = useState<any[]>([]);
    const [readers, setReaders] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchData = async () => {
        setLoading(true);
        // Fetch History
        const { data: histData, error } = await (supabase.rpc as any)('get_user_history', { p_page: 1, p_limit: 50 });
        if (error) {
            console.error("FULL RPC ERROR:", error);
        } else {
            setHistory((histData as any).data || []);
        }
        setLoading(false);

        // Fetch Widgets for RightSidebar - Sync with Home Page Logic
        const { data: popData } = await supabase.from('manga')
            .select('id, title, cover_url, rating, status, description, views, slug')
            .order('views', { ascending: false })
            .limit(4);

        if (popData) {
            setPopular(popData.map((m: any) => ({
                ...m,
                views: m.views || 0,
                rating: m.rating || 0
            })));
        }

        const { data: userData } = await supabase.from('profiles')
            .select('id, username, avatar_url, level, exp, energy, display_id')
            .eq('is_online', true)
            .limit(10);

        if (userData) {
            setReaders(userData.map((u: any) => ({
                ...u,
                id: u.id,
                display_id: u.display_id || u.id
            })));
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleDelete = async (mangaIds: string[]) => {
        if (!confirm(`Вы уверены, что хотите удалить ${mangaIds.length} элементов?`)) return;

        try {
            const { error } = await (supabase.rpc as any)('delete_reading_progress', { p_manga_ids: mangaIds });
            if (error) {
                alert('Ошибка при удалении: ' + error.message);
            } else {
                setHistory(prev => prev.filter(item => !mangaIds.includes(item.manga_id)));
                setSelectedIds(new Set());
                if (isEditing && history.length <= mangaIds.length) setIsEditing(false);
            }
        } catch (err: any) {
            console.error("Delete error:", err);
            // Don't show alert if it's an abort error
            if (err.name !== 'AbortError') {
                alert('Произошла ошибка при соединении с сервером.');
            }
        }
    };

    const toggleAll = () => {
        if (selectedIds.size === history.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(history.map(item => item.manga_id)));
        }
    };

    // Grouping logic
    const sections = {
        today: history.filter(item => isToday(parseISO(item.updated_at))),
        yesterday: history.filter(item => isYesterday(parseISO(item.updated_at))),
        week: history.filter(item => !isToday(parseISO(item.updated_at)) && !isYesterday(parseISO(item.updated_at)) && isThisWeek(parseISO(item.updated_at))),
        older: history.filter(item => !isThisWeek(parseISO(item.updated_at)))
    };

    const renderSection = (title: string, items: any[]) => {
        if (items.length === 0) return null;
        return (
            <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">{title}</h3>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="flex flex-col space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.manga_id}
                            onClick={() => isEditing && toggleSelect(item.manga_id)}
                            className={`group relative flex items-center transition-all duration-300 ${isEditing ? 'translate-x-0' : ''}`}
                        >
                            <div className={`flex-1 bg-surface-dark/40 backdrop-blur-sm border p-4 rounded-2xl flex gap-6 transition-all duration-300 ${selectedIds.has(item.manga_id) ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-white/5 hover:border-white/10 hover:shadow-xl hover:shadow-black/20'} cursor-pointer`}>
                                <div className="w-28 h-40 shrink-0 relative rounded-xl overflow-hidden shadow-xl border border-white/5">
                                    <img src={item.manga_cover || "https://placehold.co/200x300"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.manga_title} />
                                    {selectedIds.has(item.manga_id) && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center animate-in fade-in duration-300">
                                            <div className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined font-black">check</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-2 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors pr-4 tracking-tight leading-tight">{item.manga_title}</h4>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">{format(parseISO(item.updated_at), 'HH:mm', { locale: ru })}</span>
                                                {!isEditing && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete([item.manga_id]); }}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">Глава {item.chapter_number}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-primary">auto_stories</span>
                                                {item.is_completed ? 'Полностью прочитано' : `Стр. ${item.page_number} из ${item.total_pages}`}
                                            </p>
                                        </div>
                                        {!isEditing && (
                                            <div className="flex items-center gap-3">
                                                <Link href={`/read/${item.manga_slug}/${item.chapter_slug}/${item.page_number}`} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-primary text-white border border-white/10 hover:border-primary rounded-xl font-black text-[10px] transition-all uppercase tracking-widest group/btn shadow-lg hover:shadow-primary/20">
                                                    {item.is_completed ? 'Перечитать' : 'Продолжить'}
                                                    <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-0.5 transition-transform">{item.is_completed ? 'replay' : 'arrow_forward'}</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <PageLayout leftSidebar={<Sidebar />} rightSidebar={<RightSidebar popular={popular} activeUsers={readers} />}>
            <main className="flex-1 min-w-0 mx-auto space-y-8 max-w-[1000px] w-full">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter">История чтения</h1>
                    {!loading && history.length > 0 && (
                        <div className="flex items-center gap-4">
                            {isEditing ? (
                                <div className="flex items-center gap-4 bg-white/5 p-1 pr-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={toggleAll}
                                        className="px-4 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                                    >
                                        {selectedIds.size === history.length ? 'Снять выделение' : 'Выбрать все'}
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setSelectedIds(new Set()); }}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl text-[10px] transition-all uppercase tracking-widest border border-white/10"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">edit_note</span>
                                    Редактировать
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bulk Actions Floating Bar */}
                {isEditing && selectedIds.size > 0 && (
                    <div className="sticky top-24 z-30 flex justify-center pointer-events-none">
                        <div className="pointer-events-auto bg-surface-dark/90 backdrop-blur-xl border border-red-500/30 p-1.5 rounded-2xl shadow-2xl shadow-red-500/10 flex items-center gap-1 animate-in zoom-in-95 duration-300">
                            <div className="px-6 py-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Выбрано</span>
                                <div className="text-xl font-black text-white tracking-tighter leading-none">{selectedIds.size}</div>
                            </div>
                            <button
                                onClick={() => handleDelete(Array.from(selectedIds))}
                                className="flex items-center gap-3 bg-red-500 hover:bg-red-600 px-8 py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 group"
                            >
                                <span className="material-symbols-outlined text-[24px] text-white group-hover:scale-110 transition-transform">delete_forever</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">Удалить из истории</span>
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
                ) : (
                    <div className="space-y-12">
                        {history.length === 0 && <div className="text-center text-gray-500 py-20">История пуста. Начните читать!</div>}
                        {renderSection("Сегодня", sections.today)}
                        {renderSection("Вчера", sections.yesterday)}
                        {renderSection("На этой неделе", sections.week)}
                        {renderSection("Ранее", sections.older)}
                    </div>
                )}
            </main>
        </PageLayout>
    );
}
