"use client";

import { useEffect, useState } from "react";
import { browserClient as supabase } from "@/lib/supabase/client";
import AdminModal, { FormField, FormInput, FormTextarea, SaveButton } from "@/components/admin/shared/AdminModal";

interface WikiEdit {
    id: string;
    entity_id: string | null;
    manga_id: string;
    user_id: string;
    type: string;
    title: string;
    slug: string;
    proposed_content: any;
    status: string;
    admin_comment: string | null;
    created_at: string;
    manga?: { title: string };
}

interface WikiEntity {
    id: string;
    manga_id: string;
    type: string;
    slug: string;
    title: string;
    cover_image: string | null;
    is_spoiler: boolean;
    created_at: string;
    manga?: { title: string };
}

type Tab = "pending" | "entities";

export default function AdminFandomPage() {
    const [tab, setTab] = useState<Tab>("pending");
    const [edits, setEdits] = useState<WikiEdit[]>([]);
    const [entities, setEntities] = useState<WikiEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectComment, setRejectComment] = useState("");
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    async function fetchEdits() {
        setLoading(true);
        const { data, error } = await (supabase
            .from("wiki_edits") as any)
            .select("*, manga(title)")
            .eq("status", "pending")
            .order("created_at", { ascending: false });
        if (error) console.error(error);
        setEdits(data || []);
        setLoading(false);
    }

    async function fetchEntities() {
        setLoading(true);
        const { data, error } = await (supabase
            .from("wiki_entities") as any)
            .select("*, manga(title)")
            .order("created_at", { ascending: false })
            .limit(100);
        if (error) console.error(error);
        setEntities(data || []);
        setLoading(false);
    }

    useEffect(() => {
        if (tab === "pending") fetchEdits();
        else fetchEntities();
    }, [tab]);

    async function handleApprove(editId: string) {
        const { data, error } = await (supabase.rpc as any)("approve_edit", { p_edit_id: editId });
        if (error) showToast("Ошибка: " + error.message);
        else { showToast("Одобрено ✓"); fetchEdits(); }
    }

    async function handleReject() {
        if (!rejectModal) return;
        const { error } = await (supabase.from("wiki_edits") as any).update({ status: "rejected", admin_comment: rejectComment || null }).eq("id", rejectModal);
        if (error) showToast("Ошибка: " + error.message);
        else { showToast("Отклонено ✓"); setRejectModal(null); setRejectComment(""); fetchEdits(); }
    }

    async function deleteEntity(id: string) {
        if (!confirm("Удалить эту статью вики?")) return;
        const { error } = await (supabase.from("wiki_entities") as any).delete().eq("id", id);
        if (error) showToast("Ошибка: " + error.message);
        else { showToast("Удалено ✓"); fetchEntities(); }
    }

    const typeColors: Record<string, string> = {
        character: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        location: "text-green-400 bg-green-500/10 border-green-500/20",
        artifact: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        faction: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        world: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-pink-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Фандом / Вики</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Модерация и управление</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0E0E13] border border-white/5 rounded-xl p-1 w-fit">
                <button onClick={() => setTab("pending")} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tab === "pending" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}>
                    Ожидающие ({edits.length})
                </button>
                <button onClick={() => setTab("entities")} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tab === "entities" ? "bg-primary text-white" : "text-gray-500 hover:text-white"}`}>
                    Все статьи
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin"></div></div>
            ) : tab === "pending" ? (
                <div className="space-y-4">
                    {edits.length === 0 ? (
                        <div className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет ожидающих правок</div>
                    ) : edits.map(e => (
                        <div key={e.id} className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${typeColors[e.type] || "text-gray-400 bg-gray-500/10 border-gray-500/20"}`}>{e.type}</span>
                                        <h3 className="text-sm font-bold text-white">{e.title}</h3>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                        {e.manga?.title || "—"} · {new Date(e.created_at).toLocaleDateString("ru-RU")}
                                        {e.entity_id ? " · Редактирование" : " · Новая статья"}
                                    </div>
                                    {e.proposed_content && (
                                        <pre className="text-[11px] text-gray-400 bg-[#0A0A0D] rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar font-mono">
                                            {JSON.stringify(e.proposed_content, null, 2).slice(0, 500)}
                                        </pre>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleApprove(e.id)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">check</span>Одобрить
                                    </button>
                                    <button onClick={() => { setRejectModal(e.id); setRejectComment(""); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">close</span>Отклонить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Название</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тип</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Тайтл</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Spoiler</th>
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entities.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-gray-600 text-xs font-bold uppercase tracking-widest">Нет статей</td></tr>
                            ) : entities.map(e => (
                                <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-5 py-3 text-sm font-bold text-white">{e.title}</td>
                                    <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${typeColors[e.type] || ""}`}>{e.type}</span></td>
                                    <td className="px-5 py-3 text-xs text-gray-400">{e.manga?.title || "—"}</td>
                                    <td className="px-5 py-3">{e.is_spoiler ? <span className="text-yellow-400 text-xs font-bold">⚠ Да</span> : <span className="text-gray-600 text-xs">Нет</span>}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => deleteEntity(e.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all opacity-0 group-hover:opacity-100">Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            <AdminModal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Отклонить правку" size="sm">
                <FormField label="Причина отклонения (опционально)">
                    <FormTextarea value={rejectComment} onChange={setRejectComment} placeholder="Укажите причину..." rows={3} />
                </FormField>
                <SaveButton onClick={handleReject} label="Отклонить" />
            </AdminModal>
        </div>
    );
}
