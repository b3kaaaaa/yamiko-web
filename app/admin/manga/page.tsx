"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormTextarea, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Manga {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
    description: string | null;
    rating: number;
    views: number;
    status: string;
    type: string;
    created_at: string;
    chapter_count?: number;
}

const EMPTY: Partial<Manga> = { title: "", slug: "", cover_url: "", description: "", status: "ONGOING", type: "MANHWA" };

export default function AdminMangaPage() {
    const [items, setItems] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Manga> | null>(null);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchData() {
        setLoading(true);
        const { data, error } = await supabase
            .from("manga")
            .select("id, title, slug, cover_url, description, rating, views, status, type, created_at, chapters(count)")
            .order("created_at", { ascending: false })
            .limit(50);
        if (error) { console.error(error); showToast("Ошибка загрузки"); }
        setItems((data || []).map((m: any) => ({ ...m, chapter_count: m.chapters?.[0]?.count || 0 })));
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    function openAdd() { setEditing({ ...EMPTY }); setModalOpen(true); }
    function openEdit(m: Manga) { setEditing({ ...m }); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.title || !editing?.slug) return showToast("Заполните название и slug");
        setSaving(true);
        const payload = {
            title: editing.title, slug: editing.slug, cover_url: editing.cover_url || null,
            description: editing.description || null, status: editing.status, type: editing.type,
        };
        if (editing.id) {
            const { error } = await supabase.from("manga").update(payload).eq("id", editing.id);
            if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        } else {
            const { error } = await supabase.from("manga").insert(payload);
            if (error) showToast("Ошибка: " + error.message); else showToast("Добавлено ✓");
        }
        setSaving(false); setModalOpen(false); fetchData();
    }

    async function handleDelete(id: string) {
        if (!confirm("Удалить этот тайтл? Все главы тоже будут удалены.")) return;
        const { error } = await supabase.from("manga").delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message); else { showToast("Удалено ✓"); fetchData(); }
    }

    function autoSlug(title: string) {
        return title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/-+$/, "");
    }

    const filtered = items.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-purple-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Манга</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{items.length} тайтлов</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[18px]">search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="pl-9 pr-4 py-2 bg-[#121217] border border-white/5 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none w-56" />
                    </div>
                    <button onClick={openAdd} className="px-5 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>Добавить
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Обложка</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Название</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тип</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Статус</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Главы</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Просмотры</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет данных</td></tr>
                        ) : filtered.map(m => (
                            <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-3">
                                    {m.cover_url ? <img src={m.cover_url} alt="" className="w-10 h-14 object-cover rounded-lg border border-white/10" /> : <div className="w-10 h-14 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-gray-600 text-[16px]">image</span></div>}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{m.title}</div>
                                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">/{m.slug}</div>
                                </td>
                                <td className="px-5 py-3"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{m.type}</span></td>
                                <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${m.status === 'ONGOING' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : m.status === 'COMPLETED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>{m.status}</span></td>
                                <td className="px-5 py-3 text-sm text-gray-300 font-mono">{m.chapter_count}</td>
                                <td className="px-5 py-3 text-sm text-gray-400">{m.views?.toLocaleString()}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(m)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">Изменить</button>
                                        <DeleteButton onClick={() => handleDelete(m.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Редактировать тайтл" : "Новый тайтл"} size="lg">
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Название">
                        <FormInput value={editing?.title || ""} onChange={v => setEditing(prev => ({ ...prev, title: v, slug: prev?.id ? prev.slug : autoSlug(v) }))} placeholder="Solo Leveling" />
                    </FormField>
                    <FormField label="Slug">
                        <FormInput value={editing?.slug || ""} onChange={v => setEditing(prev => ({ ...prev, slug: v }))} placeholder="solo-leveling" />
                    </FormField>
                    <FormField label="Тип">
                        <FormSelect value={editing?.type || "MANHWA"} onChange={v => setEditing(prev => ({ ...prev, type: v }))} options={[{ value: "MANHWA", label: "Манхва" }, { value: "MANGA", label: "Манга" }, { value: "MANHUA", label: "Маньхуа" }]} />
                    </FormField>
                    <FormField label="Статус">
                        <FormSelect value={editing?.status || "ONGOING"} onChange={v => setEditing(prev => ({ ...prev, status: v }))} options={[{ value: "ONGOING", label: "Выходит" }, { value: "COMPLETED", label: "Завершено" }, { value: "HIATUS", label: "Перерыв" }]} />
                    </FormField>
                    <div className="col-span-2">
                        <FormField label="Ссылка на обложку">
                            <FormInput value={editing?.cover_url || ""} onChange={v => setEditing(prev => ({ ...prev, cover_url: v }))} placeholder="https://..." />
                        </FormField>
                    </div>
                    <div className="col-span-2">
                        <FormField label="Описание">
                            <FormTextarea value={editing?.description || ""} onChange={v => setEditing(prev => ({ ...prev, description: v }))} placeholder="Описание тайтла..." rows={4} />
                        </FormField>
                    </div>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
