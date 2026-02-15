"use client";

import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { useUserStore } from "@/lib/store/userStore";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    // Use the store or auth to get current user display_id for sidebar links
    // Ideally this layout is used for /settings, /profile/achievements etc which implies Own Profile
    const { currentUser } = useUserStore();

    // If currentUser is not loaded yet, sidebar links might be broken or point to undefined
    // For now we can fallback to empty string or handle loading state if critical.
    // Given the previous architecture, we can assume if this layout is active, we are likely the owner 
    // OR we are viewing our own "Dashboard" sections. 
    // However, since we moved Main Profile to /user/[id], this layout might only be used for 
    // secondary pages like /settings, which are definitely Own Profile.

    return (
        <div className="min-h-screen bg-[#0B0B0E] text-[#E5E7EB] font-sans selection:bg-purple-500/30 flex flex-col group/app">
            <Navbar />

            <div className="flex-1 max-w-[1600px] mx-auto w-full px-6 pt-6 pb-12 flex gap-8">
                {/* 
                   We pass isOwnProfile=true because this layout is typically used for 
                   private dashboard pages (Settings, etc.) 
                */}
                {currentUser?.display_id && (
                    <ProfileSidebar isOwnProfile={true} profileId={currentUser.display_id} />
                )}

                {children}
            </div>
        </div>
    );
}
