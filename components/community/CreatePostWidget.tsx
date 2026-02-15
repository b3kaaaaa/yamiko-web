"use client";

import { useUserStore } from "@/lib/store/userStore";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function CreatePostWidget({ onPostCreated, isModal }: { onPostCreated: () => void, isModal?: boolean }) {
    const { currentUser } = useUserStore();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handlePost = async () => {
        if (!content.trim()) return;
        if (!currentUser) return; // Should show login modal ideally

        setLoading(true);
        try {
            const { error } = await supabase.rpc('create_community_post', {
                p_content: content,
                p_images: [], // Future: Implement image upload
                p_type: 'discussion', // Default for widget
                p_tags: [] // Future: Tag selector
            });

            if (error) throw error;

            setContent("");
            onPostCreated(); // Refresh feed
        } catch (err) {
            console.error("Error creating post:", err);
            // Optionally toast error
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null; // Or show prompt

    return (
        <div className={`${isModal ? '' : 'bg-surface-dark border border-white/5 rounded-2xl'} p-4`}>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img
                        alt="User avatar"
                        className="h-full w-full object-cover"
                        src={currentUser.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCGDBuMJ1P_w1idCJb50C47UUrJoiQL4CkHpSIEGsYDLPnKB_1YTkNV1Gb-8WN9JM0fg2YMb80XrfEIyT0n5iEv5v0O_s1i8TarxrRnPpIFRjPaPCP0oy6nS7lGlDejTJcgwLkw8wxH-D3K7F4x2QLcXEZOZhHo6sUbNNcOeHI5Lyky9Z7TWIeteaMqUE0FOLHFfw0tlU4uxGeT1ec0xt_GXXv2JJVQCHxo9oXtT_oluaR1Y2yeemGM1k1cfNMRqH43a238RAmUMJg"}
                    />
                </div>
                <div className="flex-1">
                    <div className="bg-surface-highlight-dark/50 rounded-xl p-3 mb-3 cursor-text hover:bg-surface-highlight-dark transition-colors focus-within:bg-surface-highlight-dark focus-within:ring-1 focus-within:ring-white/10">
                        <input
                            className="w-full bg-transparent border-none text-sm text-white placeholder-gray-500 focus:ring-0 p-0"
                            placeholder="О чем думаете? Напишите теорию или отзыв..."
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">image</span>
                                <span className="text-xs font-bold hidden sm:block">Фото</span>
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 group">
                                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">poll</span>
                                <span className="text-xs font-bold hidden sm:block">Опрос</span>
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2 group">
                                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">sentiment_satisfied</span>
                            </button>
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={loading || !content.trim()}
                            className="px-6 py-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
                        >
                            {loading ? "Публикация..." : "Опубликовать"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
