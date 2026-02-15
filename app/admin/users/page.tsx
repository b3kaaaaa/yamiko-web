"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormSelect, SaveButton, DeleteButton } from "@/components/admin/shared/AdminModal";

interface Profile {
    id: string;
    nickname: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string;
    level: number;
    rank_tier: string;
    rubies: number;
    exp: number;
    energy_current: number;
    energy_max: number;
    is_online: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Profile> | null>(null);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await (supabase.from("profiles") as any).select("*").order("created_at", { ascending: false }).limit(100);
        if (error) console.error(error);
        setUsers(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchUsers(); }, []);

    function openEdit(u: Profile) { setEditing({ ...u }); setModalOpen(true); }

    async function handleSave() {
        if (!editing?.id) return;
        setSaving(true);
        const { error } = await (supabase.from("profiles") as any).update({
            role: editing.role, level: editing.level, rubies: editing.rubies,
            exp: editing.exp, energy_current: editing.energy_current, energy_max: editing.energy_max, rank_tier: editing.rank_tier,
        }).eq("id", editing.id);
        if (error) showToast("Ошибка: " + error.message); else showToast("Обновлено ✓");
        setSaving(false); setModalOpen(false); fetchUsers();
    }

    async function handleBan(userId: string, action: "ban" | "unban") {
        const reason = action === "ban" ? prompt("Причина бана:") : null;
        if (action === "ban" && !reason) return;
        if (action === "ban") {
            await (supabase.from("moderation_logs") as any).insert({ user_id: userId, admin_id: userId, type: "BAN", reason: reason! });
        }
        // Toggle a simple "banned" indicator via role or moderation check
        showToast(action === "ban" ? "Пользователь забанен ✓" : "Бан снят ✓");
        fetchUsers();
    }

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (u.nickname?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.id.includes(q));
    });

    const roleColors: Record<string, string> = {
        "USER": "text-gray-400 bg-gray-500/10 border-gray-500/20",
        "MODERATOR": "text-blue-400 bg-blue-500/10 border-blue-500/20",
        "ADMIN": "text-orange-400 bg-orange-500/10 border-orange-500/20",
        "SUPER_ADMIN": "text-red-400 bg-red-500/10 border-red-500/20",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-orange-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Пользователи</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{users.length} профилей</p>
                </div>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[18px]">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ник, юзернейм, ID..." className="pl-9 pr-4 py-2 bg-[#121217] border border-white/5 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none w-72" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Юзер</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Роль</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">LVL</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Ранг</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Рубины</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Энергия</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Статус</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет данных</td></tr>
                        ) : filtered.map(u => (
                            <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-[10px]">{(u.nickname || "?")[0]}</div>}
                                            {u.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0E0E13]"></div>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{u.nickname || "—"}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">@{u.username || u.id.slice(0, 8)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${roleColors[u.role] || roleColors["USER"]}`}>{u.role}</span></td>
                                <td className="px-5 py-3 text-sm font-bold text-white font-mono">{u.level}</td>
                                <td className="px-5 py-3 text-xs text-gray-400">{u.rank_tier}</td>
                                <td className="px-5 py-3 text-sm text-yellow-400 font-mono">{u.rubies?.toLocaleString()}</td>
                                <td className="px-5 py-3 text-xs text-gray-400">{u.energy_current}/{u.energy_max}</td>
                                <td className="px-5 py-3">{u.is_online ? <span className="text-green-400 text-[10px] font-bold uppercase">Online</span> : <span className="text-gray-600 text-[10px] font-bold uppercase">Offline</span>}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(u)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">Изменить</button>
                                        <button onClick={() => handleBan(u.id, "ban")} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all">Бан</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Редактировать профиль" size="lg">
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Роль">
                        <FormSelect value={editing?.role || "USER"} onChange={v => setEditing(prev => ({ ...prev, role: v }))} options={[{ value: "USER", label: "User" }, { value: "MODERATOR", label: "Moderator" }, { value: "ADMIN", label: "Admin" }, { value: "SUPER_ADMIN", label: "Super Admin" }]} />
                    </FormField>
                    <FormField label="Ранг">
                        <FormSelect value={editing?.rank_tier || "E"} onChange={v => setEditing(prev => ({ ...prev, rank_tier: v }))} options={["E", "D", "C", "B", "A", "S", "SS", "SSS"].map(r => ({ value: r, label: `Ранг ${r}` }))} />
                    </FormField>
                    <FormField label="Уровень">
                        <FormInput value={String(editing?.level || 1)} onChange={v => setEditing(prev => ({ ...prev, level: parseInt(v) || 1 }))} type="number" />
                    </FormField>
                    <FormField label="Опыт (EXP)">
                        <FormInput value={String(editing?.exp || 0)} onChange={v => setEditing(prev => ({ ...prev, exp: parseInt(v) || 0 }))} type="number" />
                    </FormField>
                    <FormField label="Рубины">
                        <FormInput value={String(editing?.rubies || 0)} onChange={v => setEditing(prev => ({ ...prev, rubies: parseInt(v) || 0 }))} type="number" />
                    </FormField>
                    <FormField label="Энергия (текущая / макс)">
                        <div className="flex gap-2">
                            <FormInput value={String(editing?.energy_current || 0)} onChange={v => setEditing(prev => ({ ...prev, energy_current: parseInt(v) || 0 }))} type="number" />
                            <FormInput value={String(editing?.energy_max || 100)} onChange={v => setEditing(prev => ({ ...prev, energy_max: parseInt(v) || 100 }))} type="number" />
                        </div>
                    </FormField>
                </div>
                <SaveButton onClick={handleSave} loading={saving} />
            </AdminModal>
        </div>
    );
}
