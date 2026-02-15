"use client";

import { motion, AnimatePresence } from "framer-motion";
import CreatePostWidget from "./CreatePostWidget";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4"
                    >
                        {/* Modal Container to prevent formatting issues */}
                    </motion.div>

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="bg-[#121217] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1C1C22]">
                                <h2 className="text-xl font-bold text-white">Создать публикацию</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-0 overflow-y-auto">
                                <CreatePostWidget
                                    onPostCreated={() => {
                                        onPostCreated();
                                        onClose();
                                    }}
                                    isModal={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
