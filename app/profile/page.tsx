"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function redirect() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("display_id")
                .eq("id", user.id)
                .single();

            if (profile?.display_id) {
                router.push(`/user/${profile.display_id}`);
            } else {
                router.push("/"); // Fallback
            }
        }

        redirect();
    }, [supabase, router]);

    return (
        <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-purple-600 rounded-full mb-4"></div>
                <div className="text-purple-400 font-bold">Redirecting...</div>
            </div>
        </div>
    );
}
