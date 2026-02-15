'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { FullGuildData } from '@/types/guild';
import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';
import GuildDashboardRightSidebar from '@/components/guilds/GuildDashboardRightSidebar';
import GuildDashboardLeftSidebar from '@/components/guilds/GuildDashboardLeftSidebar';
import DebugGuildList from '@/components/debug/DebugGuildList';

// Mock data for visual elements not yet in DB
const MOCK_COLLECTION = [
    { id: 1, name: 'Sung Jin-Woo', rarity: 'Legendary', color: 'text-primary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE' },
    { id: 2, name: 'Arthur', rarity: 'Epic', color: 'text-purple-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE' }, // Placeholder images
    { id: 3, name: 'Bam', rarity: 'Rare', color: 'text-blue-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE' },
    { id: 4, name: 'Khun', rarity: 'Rare', color: 'text-blue-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE' },
    { id: 5, name: 'Rak', rarity: 'Uncommon', color: 'text-green-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE' },
];

export default function SingleGuildPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = use(params);
    const guildId = decodeURIComponent(rawId);
    console.log('[SingleGuildPage] Fetching guild data for:', guildId);
    const [data, setData] = useState<FullGuildData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donationCurrency, setDonationCurrency] = useState<'gold' | 'rubies'>('gold');

    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
        try {
            // 1. Try RPC with the provided ID (could be UUID or Tag)
            const { data: guildData, error: rpcError } = await supabase.rpc('get_full_guild_data', {
                p_guild_id: guildId
            });

            if (rpcError) {
                console.warn("RPC Error (First Attempt):", rpcError);

                // 2. Fallback: Identify if it's a tag and lookup actual UUID
                // If the error is "Guild not found" or similar, try to find the ID manually from public guilds table
                // This bypasses potential issues inside the RPC's slug logic
                const { data: tagRef, error: tagError } = await supabase
                    .from('guilds')
                    .select('id')
                    .ilike('tag', guildId) // Case insensitive lookup
                    .single();

                if (tagError || !tagRef) {
                    throw rpcError; // Throw original error if fallback fails
                }

                // 3. Retry RPC with the resolved UUID
                console.log("Fallback: Found UUID for tag", guildId, "->", tagRef.id);
                const { data: retryData, error: retryError } = await supabase.rpc('get_full_guild_data', {
                    p_guild_id: tagRef.id
                });

                if (retryError) throw retryError;
                setData(retryData as FullGuildData);
            } else {
                setData(guildData as FullGuildData);
            }
        } catch (err: any) {
            console.error("Guild Fetch Error:", err);
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [guildId]);

    const handleJoin = async () => {
        const message = window.prompt("Сообщение лидеру:");
        if (message === null) return;
        const { error } = await supabase.rpc('request_join_guild', { p_guild_id: guildId, p_message: message || '' });
        if (error) alert(error.message); else { alert('Заявка отправлена!'); fetchData(); }
    };

    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.rpc('donate_to_treasury', {
                p_guild_id: guildId,
                p_amount: parseInt(donationAmount),
                p_currency_type: donationCurrency
            });
            if (error) throw error;
            setIsDonateOpen(false);
            setDonationAmount('');
            fetchData();
            alert('Donation successful!');
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center text-white">Loading...</div>;
    if (error) return (
        <div className="min-h-screen bg-[#0B0B0E] flex flex-col items-center justify-center text-white gap-4 p-8">
            <h1 className="text-2xl font-bold text-red-500">Guild Load Failed</h1>
            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl max-w-2xl w-full">
                <p className="font-mono text-xs text-red-300 mb-2">Error Details:</p>
                <pre className="text-xs text-red-400 whitespace-pre-wrap">{error}</pre>
            </div>

            <div className="max-w-2xl w-full">
                <h3 className="text-lg font-bold text-gray-400 mb-4">Available Guilds (Debug):</h3>
                <DebugGuildList />
            </div>

            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 font-bold transition-all">
                Retry Connection
            </button>
        </div>
    );
    if (!data) return <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center text-white">Guild not found</div>;

    const { info, members, user_status } = data;

    return (
        <PageLayout
            leftSidebar={
                <GuildDashboardLeftSidebar
                    guildId={guildId}
                    isMember={user_status.is_member}
                    treasuryGold={info.treasury_gold}
                    onDonate={() => setIsDonateOpen(true)}
                />
            }
            rightSidebar={
                <GuildDashboardRightSidebar
                    info={info}
                    members={members}
                />
            }
        >
            <div className="space-y-6">
                {/* HERO BLOCK */}
                <div className="w-full rounded-3xl overflow-hidden relative group h-[320px] bg-[#121217] border border-white/5">
                    {/* Background */}
                    <div className="absolute inset-0">
                        {info.banner_url && <img src={info.banner_url} className="w-full h-full object-cover opacity-50" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-transparent" />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-8 flex items-end justify-between">
                        <div className="flex items-end gap-6">
                            {/* Avatar */}
                            <div className="relative w-32 h-32 shrink-0">
                                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                                <div className="w-full h-full rounded-2xl bg-[#121217] flex items-center justify-center overflow-hidden border-4 border-[#121217] relative z-10">
                                    {info.avatar_url ? (
                                        <img src={info.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl font-black text-white">{info.tag[0]}</div>
                                    )}
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="mb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-4xl font-black text-white tracking-tight">{info.name}</h1>
                                    <span className="px-2 py-0.5 rounded bg-primary text-white text-xs font-bold uppercase tracking-wide">Lvl. {info.level}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px]">group</span>
                                        {info.member_count} участников
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
                                        [{info.tag}]
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {!user_status.is_member ? (
                            <button onClick={handleJoin} className="mb-3 px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">login</span>
                                Вступить
                            </button>
                        ) : (
                            <div className="mb-3 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold text-sm uppercase">
                                Вы участник
                            </div>
                        )}
                    </div>
                </div>

                {/* INFO & TOWER GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* INFO BOX */}
                    <div className="bg-[#121217] border border-white/5 rounded-2xl p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-gray-400">info</span>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">О гильдии</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-6 flex-1 whitespace-pre-wrap">
                            {info.description || "Описание отсутствует..."}
                        </p>
                        <div className="bg-[#1C1C22] rounded-xl p-4 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-yellow-400">star</span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Опыт</div>
                                    <div className="text-sm font-bold text-white">{info.xp.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-400">language</span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Статус</div>
                                    <div className={info.is_recruiting ? "text-sm font-bold text-green-400" : "text-sm font-bold text-red-400"}>
                                        {info.is_recruiting ? "Набор" : "Закрыт"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOWER BOX (Visual Only for now) */}
                    <div className="bg-[#121217] border border-white/5 rounded-2xl p-0 overflow-hidden relative flex flex-col h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-[#121217]/80 to-transparent z-10"></div>
                        {/* Placeholder Image */}
                        <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAeukxV_6YIfN0knCbmaNg1lTaaSOBShwNq4OWK_ocTgPNZiPCV3eZxi1_esokWGO2aapJz-mhzdSf-IPGjZP5aInuQ9S5PZCGxowxmFU7pGKo2PJjWVhmsuijTzdrVKFwR5Y0prHpqc9_OKPdI-sslhUcEbFkYAQ1OSkD879gjSvD4QNKWuTjlt5x-zEHWQzoO3t0i4IG_Vc63b-6st8buPqIkVuZAEXgkNPB6fBkUwPEWAtsaAAkfkO4KbZN-Ay9zc0mNULf5aEE')] bg-cover bg-center opacity-50"></div>

                        <div className="relative z-20 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-500">castle</span>
                                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Башня гильдии</h3>
                                </div>
                                <span className="text-xs font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Этаж {Math.floor(info.level / 5) + 1}</span>
                            </div>
                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between text-xs text-gray-400 font-medium mb-1">
                                    <span>Прогресс этажа</span>
                                    <span>{info.xp % 1000 / 10}%</span>
                                </div>
                                <div className="h-2 w-full bg-[#1C1C22] rounded-full overflow-hidden border border-white/10">
                                    <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 w-[60%] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLLECTION GRID (Mock) */}
                <div className="bg-[#121217] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">style</span>
                            <h3 className="text-base font-bold text-white">Коллекция гильдии</h3>
                        </div>
                        <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Показать все</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {MOCK_COLLECTION.map((item) => (
                            <div key={item.id} className="aspect-[2/3] rounded-xl bg-gray-800 relative overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                                <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute bottom-3 left-3 z-20">
                                    <div className={`text-[10px] ${item.color} font-bold uppercase mb-0.5`}>{item.rarity}</div>
                                    <div className="text-sm font-bold text-white">{item.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOP MEMBERS */}
                <div className="bg-[#121217] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">military_tech</span>
                            <h3 className="text-base font-bold text-white">Лучшие участники</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {members.top_5.map((member, index) => (
                            <div key={member.user_id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 flex justify-center font-black text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs">{member.username?.[0]}</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{member.username}</div>
                                        <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                                    </div>
                                </div>
                                <div className="text-right px-4">
                                    <div className="text-sm font-bold text-white">{(member.contribution_xp / 1000).toFixed(1)}k</div>
                                    <div className="text-[10px] text-gray-500 uppercase">XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Donate Modal (Reintegrated) */}
            {isDonateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsDonateOpen(false)}>
                    <div className="bg-[#121217] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">Пожертвование</h3>
                        <form onSubmit={handleDonate} className="space-y-4">
                            <input
                                type="number"
                                value={donationAmount}
                                onChange={e => setDonationAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-2xl font-black text-white text-center focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="0"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setDonationCurrency('gold')} className={`py-2 rounded-lg font-bold ${donationCurrency === 'gold' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400'}`}>Gold</button>
                                <button type="button" onClick={() => setDonationCurrency('rubies')} className={`py-2 rounded-lg font-bold ${donationCurrency === 'rubies' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'}`}>Rubies</button>
                            </div>
                            <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl">Отправить</button>
                        </form>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
