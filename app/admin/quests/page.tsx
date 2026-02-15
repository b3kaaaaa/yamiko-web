"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormTextarea, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Quest {
    id: string;
    title: string;
    description: string | null;
    type: string;
    frequency: string;
    difficulty: string;
    target_count: number;
    rewards: any;
    is_active: boolean;
    weight: number;
    created_at: string;
}

const EMPTY: Partial<Quest> = { title: "", description: "", type: "read_chapter", frequency: "daily", difficulty: "E", target_count: 1, rewards: { xp: 100 }, is_active: true, weight: 100 };

export default function AdminQuestsPage() {
    const [items, setItems] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Quest> | null>(null);
    const [rewardsStr, setRewardsStr] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchData() {
        setLoading(true);
        const { data, error } = await (supabase.from("quest_definitions") as any).select("*").order("created_at", { ascending: false });
        if (error) console.error(error);
        setItems(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    function openAdd() { setEditing({ ...EMPTY }); setRewardsStr(JSON.stringify({ xp: 100 }, null, 2)); setModalOpen(true); }
    function openEdit(q: Quest) { setEditing({ ...q }); setRewardsStr(JSON.stringify(q.rewards, null, 2)); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.title) return showToast("Введите название квеста");
        let parsedRewards: any;
        try { parsedRewards = JSON.parse(rewardsStr); } catch { return showToast("Невалидный JSON наград"); }
        setSaving(true);
        const payload = {
            title: editing.title, description: editing.description || null,
            type: editing.type, frequency: editing.frequency, difficulty: editing.difficulty,
            target_count: editing.target_count, rewards: parsedRewards,
            is_active: editing.is_active, weight: editing.weight,
        };
        if (editing.id) {
            const { error } = await (supabase.from("quest_definitions") as any).update(payload).eq("id", editing.id);
            if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        } else {
            const { error } = await (supabase.from("quest_definitions") as any).insert(payload);
            if (error) showToast("Ошибка: " + error.message); else showToast("Добавлено ✓");
        }
        setSaving(false); setModalOpen(false); fetchData();
    }

    async function toggleActive(id: string, current: boolean) {
        await (supabase.from("quest_definitions") as any).update({ is_active: !current }).eq("id", id);
        showToast(!current ? "Активирован ✓" : "Деактивирован ✓");
        fetchData();
    }

    async function handleDelete(id: string) {
        if (!confirm("Удалить этот квест?")) return;
        const { error } = await (supabase.from("quest_definitions") as any).delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message); else { showToast("Удалено ✓"); fetchData(); }
    }

    const diffColors: Record<string, string> = { E: "text-gray-400", D: "text-green-400", C: "text-blue-400", B: "text-purple-400", A: "text-orange-400", S: "text-red-400" };
    const freqColors: Record<string, string> = { daily: "bg-blue-500/10 text-blue-400 border-blue-500/20", weekly: "bg-purple-500/10 text-purple-400 border-purple-500/20", epic: "bg-orange-500/10 text-orange-400 border-orange-500/20" };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-yellow-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Квесты</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{items.length} определений</p>
                </div>
                <button onClick={openAdd} className="px-5 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>Новый квест
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Актив</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Квест</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тип</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Частота</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Сложность</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Цель</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Награды</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-yellow-500 rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет квестов</td></tr>
                        ) : items.map(q => (
                            <tr key={q.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group ${!q.is_active ? 'opacity-40' : ''}`}>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleActive(q.id, q.is_active)} className={`w-9 h-5 rounded-full transition-colors relative ${q.is_active ? 'bg-green-500' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${q.is_active ? 'left-[18px]' : 'left-0.5'}`}></div>
                                    </button>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="text-sm font-bold text-white">{q.title}</div>
                                    {q.description && <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[200px]">{q.description}</div>}
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-400 font-mono">{q.type}</td>
                                <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${freqColors[q.frequency] || ""}`}>{q.frequency}</span></td>
                                <td className="px-5 py-3"><span className={`text-lg font-black ${diffColors[q.difficulty] || "text-gray-400"}`}>{q.difficulty}</span></td>
                                <td className="px-5 py-3 text-sm text-gray-300 font-mono">{q.target_count}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2 text-[10px]">
                                        {q.rewards?.xp && <span className="text-blue-400 font-bold">+{q.rewards.xp} XP</span>}
                                        {q.rewards?.rubies && <span className="text-yellow-400 font-bold">+{q.rewards.rubies} 💎</span>}
                                        {q.rewards?.energy && <span className="text-green-400 font-bold">+{q.rewards.energy} ⚡</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(q)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">Изменить</button>
                                        <DeleteButton onClick={() => handleDelete(q.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Редактировать квест" : "Новый квест"} size="lg">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <FormField label="Название">
                            <FormInput value={editing?.title || ""} onChange={v => setEditing(prev => ({ ...prev, title: v }))} placeholder="Чтец Бездны" />
                        </FormField>
                    </div>
                    <div className="col-span-2">
                        <FormField label="Описание">
                            <FormTextarea value={editing?.description || ""} onChange={v => setEditing(prev => ({ ...prev, description: v }))} placeholder="Прочитайте 5 глав..." />
                        </FormField>
                    </div>
                    <FormField label="Тип действия">
                        <FormSelect value={editing?.type || "read_chapter"} onChange={v => setEditing(prev => ({ ...prev, type: v }))} options={[{ value: "read_chapter", label: "Чтение глав" }, { value: "comment", label: "Комментарий" }, { value: "like", label: "Лайк" }, { value: "share", label: "Поделиться" }, { value: "login", label: "Вход" }]} />
                    </FormField>
                    <FormField label="Частота">
                        <FormSelect value={editing?.frequency || "daily"} onChange={v => setEditing(prev => ({ ...prev, frequency: v }))} options={[{ value: "daily", label: "Ежедневный" }, { value: "weekly", label: "Еженедельный" }, { value: "epic", label: "Эпический" }]} />
                    </FormField>
                    <FormField label="Сложность">
                        <FormSelect value={editing?.difficulty || "E"} onChange={v => setEditing(prev => ({ ...prev, difficulty: v }))} options={["E", "D", "C", "B", "A", "S"].map(d => ({ value: d, label: `Ранг ${d}` }))} />
                    </FormField>
                    <FormField label="Цель (кол-во)">
                        <FormInput value={String(editing?.target_count || 1)} onChange={v => setEditing(prev => ({ ...prev, target_count: parseInt(v) || 1 }))} type="number" />
                    </FormField>
                    <FormField label="Вес (приоритет)">
                        <FormInput value={String(editing?.weight || 100)} onChange={v => setEditing(prev => ({ ...prev, weight: parseInt(v) || 100 }))} type="number" />
                    </FormField>
                    <FormField label="Активен">
                        <FormSelect value={editing?.is_active ? "true" : "false"} onChange={v => setEditing(prev => ({ ...prev, is_active: v === "true" }))} options={[{ value: "true", label: "Да" }, { value: "false", label: "Нет" }]} />
                    </FormField>
                    <div className="col-span-2">
                        <FormField label="Награды (JSON)">
                            <FormTextarea value={rewardsStr} onChange={setRewardsStr} placeholder='{"xp": 100, "rubies": 10}' rows={4} />
                        </FormField>
                    </div>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
