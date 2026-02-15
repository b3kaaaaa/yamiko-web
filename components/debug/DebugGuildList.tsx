'use client';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugGuildList() {
    const [guilds, setGuilds] = useState<any[]>([]);
    const [err, setErr] = useState<string>('');

    useEffect(() => {
        const fetch = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data, error } = await supabase.from('guilds').select('id, name, tag').limit(10);
            if (error) setErr(error.message);
            else setGuilds(data || []);
        };
        fetch();
    }, []);

    if (err) return <div className="text-red-500 text-xs">Failed to list guilds: {err}</div>;
    if (guilds.length === 0) return <div className="text-gray-500 text-xs">No guilds found in DB.</div>;

    return (
        <div className="grid grid-cols-1 gap-2">
            {guilds.map(g => (
                <div key={g.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                    <div>
                        <span className="font-bold text-white">{g.name}</span>
                        <span className="ml-2 text-xs text-gray-400">[{g.tag}]</span>
                    </div>
                    <div className="flex gap-2 text-xs font-mono text-gray-500">
                        <span>{g.id}</span>
                        <Link href={`/guilds/${g.tag}`} className="text-primary hover:underline">Link (Tag)</Link>
                        <Link href={`/guilds/${g.id}`} className="text-primary hover:underline">Link (ID)</Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
