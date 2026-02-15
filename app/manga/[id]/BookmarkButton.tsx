'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import BookmarkModal from '@/components/features/BookmarkModal';

interface BookmarkButtonProps {
    mangaId: string;
    mangaTitle: string; // Added prop
    initialIsBookmarked?: boolean;
    initialStatus?: 'READING' | 'PLANNED' | 'COMPLETED' | 'DROPPED' | 'FAVORITE' | null;
}

export default function BookmarkButton({ mangaId, mangaTitle, initialIsBookmarked = false, initialStatus = null }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [currentStatus, setCurrentStatus] = useState(initialStatus);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currentUser, openLoginModal } = useUserStore();

    const handleClick = () => {
        if (!currentUser) {
            openLoginModal();
            return;
        }
        setIsModalOpen(true);
    };

    const handleUpdate = (newStatus: any) => {
        setIsBookmarked(!!newStatus);
        setCurrentStatus(newStatus);
    };

    return (
        <>
            <button
                onClick={handleClick}
                className="h-11 w-12 bg-[#121217] hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:text-primary transition-all group backdrop-blur-md disabled:opacity-50"
                title="Добавить в закладки"
            >
                <span className={`material-symbols-outlined text-xl group-hover:scale-110 transition-transform ${isBookmarked ? 'filled text-primary' : ''}`}>
                    {isBookmarked ? 'bookmark' : 'bookmark_add'}
                </span>
            </button>

            <BookmarkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mangaId={mangaId}
                mangaTitle={mangaTitle}
                currentStatus={currentStatus}
                onUpdate={handleUpdate}
            />
        </>
    );
}
