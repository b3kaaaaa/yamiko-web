"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormTextarea, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Item {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    type: string;
    rarity: string;
    effects: any;
}

const EMPTY: Partial<Item> = { name: "", description: "", image_url: "", type: "MATERIAL", rarity: "COMMON", effects: {} };

export default function AdminShopPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Item> | null>(null);
    const [effectsStr, setEffectsStr] = useState("");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchData() {
        setLoading(true);
        const { data, error } = await supabase.from("items").select("*").order("name");
        if (error) console.error(error);
        setItems(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    function openAdd() { setEditing({ ...EMPTY }); setEffectsStr("{}"); setModalOpen(true); }
    function openEdit(i: Item) { setEditing({ ...i }); setEffectsStr(JSON.stringify(i.effects, null, 2)); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.name) return showToast("Введите название");
        let parsedEffects: any;
        try { parsedEffects = JSON.parse(effectsStr); } catch { return showToast("Невалидный JSON эффектов"); }
        setSaving(true);
        const payload = { name: editing.name, description: editing.description || null, image_url: editing.image_url || null, type: editing.type, rarity: editing.rarity, effects: parsedEffects };
        if (editing.id) {
            const { error } = await supabase.from("items").update(payload).eq("id", editing.id);
            if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        } else {
            const { error } = await supabase.from("items").insert(payload);
            if (error) showToast("Ошибка: " + error.message); else showToast("Добавлено ✓");
        }
        setSaving(false); setModalOpen(false); fetchData();
    }

    async function handleDelete(id: string) {
        if (!confirm("Удалить предмет?")) return;
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message); else { showToast("Удалено ✓"); fetchData(); }
    }

    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    const rarityColors: Record<string, string> = {
        COMMON: "text-gray-400 bg-gray-500/10 border-gray-500/20",
        RARE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        EPIC: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        LEGENDARY: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        ARTIFACT: "text-red-400 bg-red-500/10 border-red-500/20",
        MYTHIC: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    };

    const typeIcons: Record<string, string> = {
        CONSUMABLE: "local_drink", MATERIAL: "category", EQUIPMENT: "shield",
        KEY_ITEM: "vpn_key", CARD: "style", ARTIFACT: "auto_awesome",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-green-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Магазин / Предметы</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{items.length} предметов</p>
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
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Предмет</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тип</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Редкость</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Эффекты</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-green-500 rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет предметов</td></tr>
                        ) : filtered.map(item => (
                            <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#1A1A23] border border-white/10 flex items-center justify-center shrink-0">
                                            {item.image_url ? <img src={item.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <span className="material-symbols-outlined text-gray-500 text-[18px]">{typeIcons[item.type] || "category"}</span>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{item.name}</div>
                                            {item.description && <div className="text-[10px] text-gray-500 truncate max-w-[200px] mt-0.5">{item.description}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-400 font-mono">{item.type}</td>
                                <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${rarityColors[item.rarity] || rarityColors["COMMON"]}`}>{item.rarity}</span></td>
                                <td className="px-5 py-3 text-[10px] text-gray-500 font-mono max-w-[150px] truncate">
                                    {item.effects && Object.keys(item.effects).length > 0 ? JSON.stringify(item.effects) : "—"}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(item)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">Изменить</button>
                                        <DeleteButton onClick={() => handleDelete(item.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Редактировать предмет" : "Новый предмет"} size="lg">
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Название">
                        <FormInput value={editing?.name || ""} onChange={v => setEditing(prev => ({ ...prev, name: v }))} placeholder="Зелье опыта" />
                    </FormField>
                    <FormField label="Изображение (URL)">
                        <FormInput value={editing?.image_url || ""} onChange={v => setEditing(prev => ({ ...prev, image_url: v }))} placeholder="https://..." />
                    </FormField>
                    <FormField label="Тип">
                        <FormSelect value={editing?.type || "MATERIAL"} onChange={v => setEditing(prev => ({ ...prev, type: v }))} options={[
                            { value: "CONSUMABLE", label: "Расходник" }, { value: "MATERIAL", label: "Материал" },
                            { value: "EQUIPMENT", label: "Снаряжение" }, { value: "KEY_ITEM", label: "Ключевой" },
                            { value: "CARD", label: "Карта" }, { value: "ARTIFACT", label: "Артефакт" }
                        ]} />
                    </FormField>
                    <FormField label="Редкость">
                        <FormSelect value={editing?.rarity || "COMMON"} onChange={v => setEditing(prev => ({ ...prev, rarity: v }))} options={[
                            { value: "COMMON", label: "Обычный" }, { value: "RARE", label: "Редкий" },
                            { value: "EPIC", label: "Эпический" }, { value: "LEGENDARY", label: "Легендарный" },
                            { value: "ARTIFACT", label: "Артефактный" }, { value: "MYTHIC", label: "Мифический" }
                        ]} />
                    </FormField>
                    <div className="col-span-2">
                        <FormField label="Описание">
                            <FormTextarea value={editing?.description || ""} onChange={v => setEditing(prev => ({ ...prev, description: v }))} placeholder="Описание предмета..." />
                        </FormField>
                    </div>
                    <div className="col-span-2">
                        <FormField label="Эффекты (JSON)">
                            <FormTextarea value={effectsStr} onChange={setEffectsStr} placeholder='{"xp_boost": 1.5, "duration": 3600}' rows={3} />
                        </FormField>
                    </div>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
