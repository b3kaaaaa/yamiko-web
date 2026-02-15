"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormTextarea, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Achievement {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    condition: string | null;
    rewards: any;
}

const EMPTY: Partial<Achievement> = { name: "", description: "", icon_url: "", condition: "", rewards: { xp: 50 } };

export default function AdminAchievementsPage() {
    const [items, setItems] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Achievement> | null>(null);
    const [rewardsStr, setRewardsStr] = useState("");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchData() {
        setLoading(true);
        const { data, error } = await supabase.from("achievements").select("*").order("name");
        if (error) console.error(error);
        setItems(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    function openAdd() { setEditing({ ...EMPTY }); setRewardsStr(JSON.stringify({ xp: 50 }, null, 2)); setModalOpen(true); }
    function openEdit(a: Achievement) { setEditing({ ...a }); setRewardsStr(JSON.stringify(a.rewards, null, 2)); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.name) return showToast("Введите название");
        let parsedRewards: any;
        try { parsedRewards = JSON.parse(rewardsStr); } catch { return showToast("Невалидный JSON наград"); }
        setSaving(true);
        const payload = { name: editing.name, description: editing.description || null, icon_url: editing.icon_url || null, condition: editing.condition || null, rewards: parsedRewards };
        if (editing.id) {
            const { error } = await (supabase.from("achievements") as any).update(payload).eq("id", editing.id);
            if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        } else {
            const { error } = await (supabase.from("achievements") as any).insert(payload);
            if (error) showToast("Ошибка: " + error.message); else showToast("Добавлено ✓");
        }
        setSaving(false); setModalOpen(false); fetchData();
    }

    async function handleDelete(id: string) {
        if (!confirm("Удалить достижение?")) return;
        const { error } = await supabase.from("achievements").delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message); else { showToast("Удалено ✓"); fetchData(); }
    }

    const filtered = items.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-amber-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Достижения</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{items.length} достижений</p>
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

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin"></div></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет достижений</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(a => (
                        <div key={a.id} className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group relative">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    {a.icon_url ? <img src={a.icon_url} alt="" className="w-8 h-8 rounded" /> : <span className="material-symbols-outlined text-amber-400">trophy</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate">{a.name}</h3>
                                    {a.description && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{a.description}</p>}
                                    {a.condition && <p className="text-[10px] text-gray-600 mt-2 italic">Условие: {a.condition}</p>}
                                    <div className="flex gap-2 mt-2 text-[10px]">
                                        {a.rewards?.xp && <span className="text-blue-400 font-bold">+{a.rewards.xp} XP</span>}
                                        {a.rewards?.rubies && <span className="text-yellow-400 font-bold">+{a.rewards.rubies} 💎</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(a)} className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all">
                                    <span className="material-symbols-outlined text-[14px] text-white">edit</span>
                                </button>
                                <button onClick={() => handleDelete(a.id)} className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center transition-all">
                                    <span className="material-symbols-outlined text-[14px] text-red-400">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Редактировать достижение" : "Новое достижение"} size="md">
                <div className="space-y-4">
                    <FormField label="Название">
                        <FormInput value={editing?.name || ""} onChange={v => setEditing(prev => ({ ...prev, name: v }))} placeholder="Первый шаг" />
                    </FormField>
                    <FormField label="Описание">
                        <FormTextarea value={editing?.description || ""} onChange={v => setEditing(prev => ({ ...prev, description: v }))} placeholder="Прочитайте первую главу" />
                    </FormField>
                    <FormField label="Условие получения">
                        <FormInput value={editing?.condition || ""} onChange={v => setEditing(prev => ({ ...prev, condition: v }))} placeholder="Прочитать 1 главу" />
                    </FormField>
                    <FormField label="Иконка (URL)">
                        <FormInput value={editing?.icon_url || ""} onChange={v => setEditing(prev => ({ ...prev, icon_url: v }))} placeholder="https://..." />
                    </FormField>
                    <FormField label="Награды (JSON)">
                        <FormTextarea value={rewardsStr} onChange={setRewardsStr} placeholder='{"xp": 50, "rubies": 10}' rows={3} />
                    </FormField>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
