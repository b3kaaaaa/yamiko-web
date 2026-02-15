'use client';

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';

export default function PageLayout({
    children,
    rightSidebar,
    leftSidebar
}: {
    children: React.ReactNode;
    rightSidebar?: React.ReactNode;
    leftSidebar?: React.ReactNode;
}) {
    return (
        <>
            <LoginModal />
            <RegisterModal />
            <Navbar />
            <div className="relative max-w-[1600px] mx-auto flex gap-6 px-6 pt-6 pb-16 w-full">
                {leftSidebar === undefined ? <Sidebar /> : leftSidebar}
                <main className="flex-1 min-w-0 mx-auto">
                    {children}
                </main>
                {rightSidebar}
            </div>
        </>
    );
}
