"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Chapter {
    id: string;
    manga_id: string;
    title: string | null;
    number: number;
    slug: string | null;
    created_at: string;
}

interface MangaOption {
    id: string;
    title: string;
}

export default function AdminChaptersPage() {
    const [mangaList, setMangaList] = useState<MangaOption[]>([]);
    const [selectedManga, setSelectedManga] = useState<string>("");
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Chapter> | null>(null);
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    useEffect(() => {
        (async () => {
            const { data } = await (supabase.from("manga") as any).select("id, title").order("title");
            setMangaList(data || []);
            if (data && data.length > 0) setSelectedManga(data[0].id);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (selectedManga) fetchChapters();
    }, [selectedManga]);

    async function fetchChapters() {
        setLoading(true);
        const { data, error } = await (supabase
            .from("chapters") as any)
            .select("*")
            .eq("manga_id", selectedManga)
            .order("number", { ascending: false });
        if (error) console.error(error);
        setChapters(data || []);
        setLoading(false);
    }

    function openAdd() { setEditing({ manga_id: selectedManga, title: "", number: (chapters[0]?.number || 0) + 1, slug: "" }); setModalOpen(true); }
    function openEdit(c: Chapter) { setEditing({ ...c }); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.number) return showToast("Укажите номер главы");
        setSaving(true);
        const payload = { manga_id: selectedManga, title: editing.title || null, number: editing.number, slug: editing.slug || `ch-${editing.number}` };
        if (editing.id) {
            const { error } = await (supabase.from("chapters") as any).update(payload).eq("id", editing.id);
            if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        } else {
            const { error } = await (supabase.from("chapters") as any).insert(payload);
            if (error) showToast("Ошибка: " + error.message); else showToast("Добавлено ✓");
        }
        setSaving(false); setModalOpen(false); fetchChapters();
    }

    async function handleDelete(id: string) {
        if (!confirm("Удалить эту главу?")) return;
        const { error } = await (supabase.from("chapters") as any).delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message); else { showToast("Удалено ✓"); fetchChapters(); }
    }

    const mangaTitle = mangaList.find(m => m.id === selectedManga)?.title || "";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-blue-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Главы</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{chapters.length} глав · {mangaTitle}</p>
                </div>
                <div className="flex gap-3 items-center">
                    <select value={selectedManga} onChange={e => setSelectedManga(e.target.value)} className="bg-[#121217] border border-white/5 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 focus:outline-none appearance-none cursor-pointer max-w-[250px]">
                        {mangaList.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                    <button onClick={openAdd} disabled={!selectedManga} className="px-5 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>Добавить
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Номер</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Название</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Slug</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Дата</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : chapters.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет глав для этого тайтла</td></tr>
                        ) : chapters.map(c => (
                            <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-3"><span className="text-sm font-bold text-white font-mono">#{c.number}</span></td>
                                <td className="px-5 py-3 text-sm text-gray-300">{c.title || <span className="text-gray-600 italic">Без названия</span>}</td>
                                <td className="px-5 py-3 text-[11px] text-gray-600 font-mono">{c.slug}</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString("ru-RU")}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(c)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">Изменить</button>
                                        <DeleteButton onClick={() => handleDelete(c.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Редактировать главу" : "Новая глава"}>
                <div className="space-y-4">
                    <FormField label="Номер главы">
                        <FormInput value={String(editing?.number || "")} onChange={v => setEditing(prev => ({ ...prev, number: parseFloat(v) || 0 }))} placeholder="1" type="number" />
                    </FormField>
                    <FormField label="Название (опционально)">
                        <FormInput value={editing?.title || ""} onChange={v => setEditing(prev => ({ ...prev, title: v }))} placeholder="Начало нового пути" />
                    </FormField>
                    <FormField label="Slug">
                        <FormInput value={editing?.slug || ""} onChange={v => setEditing(prev => ({ ...prev, slug: v }))} placeholder="ch-1" />
                    </FormField>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
