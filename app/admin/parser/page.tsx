"use client";

import { useState } from "react";
import { FormField, FormInput, FormTextarea } from "@/components/admin/shared/AdminModal";

interface ParseJob {
    id: number;
    source: string;
    url: string;
    status: "idle" | "running" | "done" | "error";
    lastRun: string | null;
    chaptersFound: number;
}

export default function AdminParserPage() {
    const [sources, setSources] = useState<ParseJob[]>([
        { id: 1, source: "MangaDex", url: "https://api.mangadex.org", status: "idle", lastRun: null, chaptersFound: 0 },
        { id: 2, source: "Custom Source", url: "", status: "idle", lastRun: null, chaptersFound: 0 },
    ]);
    const [newUrl, setNewUrl] = useState("");
    const [newName, setNewName] = useState("");
    const [globalLog, setGlobalLog] = useState<string[]>([]);
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    function addSource() {
        if (!newName || !newUrl) return showToast("Заполните название и URL");
        setSources(prev => [...prev, { id: Date.now(), source: newName, url: newUrl, status: "idle", lastRun: null, chaptersFound: 0 }]);
        setNewName(""); setNewUrl("");
        showToast("Источник добавлен ✓");
    }

    function removeSource(id: number) {
        setSources(prev => prev.filter(s => s.id !== id));
        showToast("Удалено ✓");
    }

    async function runParser(id: number) {
        setSources(prev => prev.map(s => s.id === id ? { ...s, status: "running" as const } : s));
        setGlobalLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Запуск парсера для #${id}...`]);

        // Simulate parser run
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        const found = Math.floor(Math.random() * 20);

        setSources(prev => prev.map(s => s.id === id ? { ...s, status: "done" as const, lastRun: new Date().toISOString(), chaptersFound: s.chaptersFound + found } : s));
        setGlobalLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Парсер #${id} завершён. Найдено: ${found} новых глав.`]);
        showToast(`Парсинг завершён: ${found} глав`);
    }

    async function runAll() {
        for (const s of sources) {
            await runParser(s.id);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {toast && <div className="fixed top-6 right-6 z-[60] bg-[#1A1A23] border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300">{toast}</div>}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="border-l-4 border-cyan-500 pl-6">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Парсер</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Автоимпорт контента</p>
                </div>
                <button onClick={runAll} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>Запустить все
                </button>
            </div>

            {/* Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map(s => (
                    <div key={s.id} className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl p-5 space-y-4 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'running' ? 'bg-cyan-400 animate-pulse' : s.status === 'done' ? 'bg-green-400' : s.status === 'error' ? 'bg-red-400' : 'bg-gray-600'}`}></div>
                                <h3 className="text-sm font-bold text-white">{s.source}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => runParser(s.id)} disabled={s.status === 'running'} className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg transition-all disabled:opacity-50">
                                    {s.status === 'running' ? <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div> : "Запуск"}
                                </button>
                                <button onClick={() => removeSource(s.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all opacity-0 group-hover:opacity-100">×</button>
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono break-all">{s.url || "URL не задан"}</div>
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Последний запуск: {s.lastRun ? new Date(s.lastRun).toLocaleString("ru-RU") : "—"}</span>
                            <span>Всего глав: {s.chaptersFound}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Source */}
            <div className="bg-[#0E0E13]/80 border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-[18px]">add_circle</span>
                    Добавить источник
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Название">
                        <FormInput value={newName} onChange={setNewName} placeholder="MangaLib" />
                    </FormField>
                    <FormField label="URL / API Endpoint">
                        <FormInput value={newUrl} onChange={setNewUrl} placeholder="https://api.example.com/manga" />
                    </FormField>
                    <div className="flex items-end">
                        <button onClick={addSource} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all">Добавить</button>
                    </div>
                </div>
            </div>

            {/* Console Log */}
            <div className="bg-[#0A0A0D] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-[18px]">terminal</span>
                    Консоль
                </h3>
                <div className="font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {globalLog.length === 0 ? (
                        <div className="text-gray-600">Ожидание команд...</div>
                    ) : globalLog.map((line, i) => (
                        <div key={i} className="text-green-400/80">{line}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
