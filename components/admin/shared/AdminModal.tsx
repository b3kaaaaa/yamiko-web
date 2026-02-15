"use client";

import { useEffect, useRef } from "react";

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export default function AdminModal({ isOpen, onClose, title, children, size = "md" }: AdminModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={`${widths[size]} w-full mx-4 bg-[#0E0E13] border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* Reusable form field components */
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
            {children}
        </div>
    );
}

export function FormInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#1A1A23] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none transition-colors"
        />
    );
}

export function FormTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-[#1A1A23] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none transition-colors resize-none"
        />
    );
}

export function FormSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#1A1A23] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none transition-colors appearance-none cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

export function SaveButton({ onClick, loading, label = "Сохранить" }: { onClick: () => void; loading?: boolean; label?: string }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="w-full mt-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {label}
                </>
            )}
        </button>
    );
}

export function DeleteButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
        >
            {loading ? "..." : "Удалить"}
        </button>
    );
}
