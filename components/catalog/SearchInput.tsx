'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Simple debounce hook implementation to avoid external dependencies
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [text, setText] = useState(searchParams.get('query') || '');
    const query = useDebounce(text, 500);

    useEffect(() => {
        // Only update URL if the query string actually changed
        const currentQuery = searchParams.get('query') || '';
        if (query === currentQuery) return;

        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set('query', query);
        } else {
            params.delete('query');
        }
        router.push(pathname + '?' + params.toString());
    }, [query, router, pathname, searchParams]);

    return (
        <div className="relative w-full max-w-xl shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
            <input
                className="w-full bg-surface-dark border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-500 shadow-sm transition-all"
                placeholder="Поиск по каталогу..."
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}
