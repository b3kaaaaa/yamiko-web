"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Database } from "@/types/supabase";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { useUserStore } from "@/lib/store/userStore";
import PageLayout from "@/components/layout/PageLayout";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type TowerLevel = Database["public"]["Tables"]["tower_levels"]["Row"];
type InventoryItem = {
    quantity: number;
    items: Database["public"]["Tables"]["items"]["Row"];
};
type Guild = Database["public"]["Tables"]["guilds"]["Row"] & { tag?: string };

export default function UserProfilePage() {
    const params = useParams();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [towerLevels, setTowerLevels] = useState<TowerLevel[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [guild, setGuild] = useState<Guild | null>(null);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { currentUser: storeUser } = useUserStore();
    const [stats, setStats] = useState({ titles: 0, friends: 0, likes: 0, posts: 0 });
    // Wall State
    const [wallPosts, setWallPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const rawId = params?.id;
            const profileId = Array.isArray(rawId) ? rawId[0] : rawId;

            if (!profileId) return;

            // 0. Get Current User for auth check
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                if (myProfile) setCurrentUser(myProfile as Profile);
            }

            // 1. Fetch Target Profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("display_id", profileId)
                .single();

            if (profileError || !profileData) {
                setError("Пользователь не найден");
                setLoading(false);
                return;
            }
            const userProfile = profileData as unknown as Profile;
            setProfile(userProfile);

            // 2. Fetch Guild (via guild_members)
            const { data: memberData } = await supabase
                .from("guild_members")
                .select("guild_id, guilds(*)")
                .eq("user_id", userProfile.id)
                .single();

            if (memberData && (memberData as any).guilds) {
                setGuild((memberData as any).guilds as Guild);
            }

            // 3. Fetch Friends
            const { data: friendships } = await supabase
                .from("friendships")
                .select("user_id_1, user_id_2")
                .or(`user_id_1.eq.${userProfile.id},user_id_2.eq.${userProfile.id}`)
                .eq("status", "ACCEPTED")
                .limit(5);

            if (friendships && friendships.length > 0) {
                // Extract IDs of friends
                const friendIds = friendships.map((f: any) => f.user_id_1 === userProfile.id ? f.user_id_2 : f.user_id_1);
                const { data: friendsData } = await supabase.from('profiles').select('*').in('id', friendIds);
                if (friendsData) setFriends(friendsData as Profile[]);
            }

            // 4. Fetch Tower
            const currentFloor = (userProfile as any)?.tower_floor || 1;
            const minFloor = Math.max(1, currentFloor - 2);
            const maxFloor = currentFloor + 2;
            const { data: towerData } = await supabase.from("tower_levels").select("*").gte("floor_number", minFloor).lte("floor_number", maxFloor).order("floor_number", { ascending: false });
            if (towerData) setTowerLevels(towerData);

            // 5. Fetch Inventory (Showcase)
            const { data: invData } = await supabase.from("user_inventory").select("*, items(*)").eq("user_id", userProfile.id).limit(6);
            if (invData) {
                setInventory(invData.map((item: any) => ({ quantity: item.quantity, items: item.items })));
            }

            // 6. Fetch Stats (Titles, Friends Count)
            const { count: titlesCount } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userProfile.id);
            const { count: friendsCount } = await supabase.from('friendships').select('*', { count: 'exact', head: true }).or(`user_id_1.eq.${userProfile.id},user_id_2.eq.${userProfile.id}`).eq("status", "ACCEPTED");

            // 6.5 Fetch Wall Posts (NEW)
            const { data: postsData } = await supabase
                .from('wall_posts')
                .select('*, author:author_id(*)')
                .eq('user_id', userProfile.id)
                .order('created_at', { ascending: false });

            if (postsData) setWallPosts(postsData);

            // Update stats state (need to add state first)
            setStats({
                titles: titlesCount || 0,
                friends: friendsCount || 0,
                likes: 0, // No table yet
                posts: postsData?.length || 0
            });

            setLoading(false);
        };

        fetchData();
    }, [params?.id]);

    const handlePostComment = async () => {
        if (!currentUser || !profile || !newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const { data, error } = await supabase
                .from('wall_posts')
                .insert({
                    user_id: profile.id, // Profile owner
                    author_id: currentUser.id, // Current user
                    content: newPostContent.trim()
                } as any)
                .select('*, author:author_id(*)')
                .single();

            if (error) throw error;

            if (data) {
                setWallPosts([data, ...wallPosts]);
                setNewPostContent("");
                setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
            }
        } catch (err) {
            console.error('Failed to post:', err);
            alert('Не удалось отправить сообщение');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Удалить сообщение?')) return;
        try {
            const { error } = await supabase
                .from('wall_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            setWallPosts(wallPosts.filter(p => p.id !== postId));
            setStats(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    if (loading) return (
        <PageLayout leftSidebar={<ProfileSidebar profileId={Array.isArray(params?.id) ? params?.id[0] : params?.id as string} />}>
            <ProfileSkeleton />
        </PageLayout>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-[#0B0B0E] flex flex-col items-center justify-center text-white gap-4">
            <h1 className="text-2xl font-bold uppercase">{error || "Пользователь не найден"}</h1>
            <Link href="/" className="px-6 py-2 bg-purple-600 rounded-lg">На главную</Link>
        </div>
    );

    const isOwnProfile = currentUser?.id === profile.id;

    // Right Sidebar Content
    const RightSidebarContent = (
        <aside className="hidden lg:flex flex-col w-72 shrink-0 space-y-6 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
            {/* 1. Statistics */}
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-lg bg-[#121217]/80">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-blue-400 text-lg">analytics</span>
                        Статистика
                    </h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <div className="bg-[#1C1C22]/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-white tracking-tight">4,285</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Глав прочитано</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1C1C22]/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                            <span className="text-xl font-black text-pink-500 group-hover:scale-110 transition-transform">{stats.likes}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Лайки</span>
                        </div>
                        <div className="bg-[#1C1C22]/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                            <span className="text-xl font-black text-blue-400 group-hover:scale-110 transition-transform">{stats.friends}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Друзей</span>
                        </div>
                        <div className="bg-[#1C1C22]/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                            <span className="text-xl font-black text-green-400 group-hover:scale-110 transition-transform">{stats.titles}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Тайтлов</span>
                        </div>
                        <div className="bg-[#1C1C22]/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                            <span className="text-xl font-black text-yellow-400 group-hover:scale-110 transition-transform">{stats.posts}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Постов</span>
                        </div>
                    </div>
                    <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">На сайте с</span>
                            <span className="text-white font-bold">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">ID пользователя</span>
                            <span className="font-mono text-gray-300">{profile.display_id}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. My Guilds */}
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-lg bg-[#121217]/80">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-purple-400 text-lg">diversity_3</span>
                        Мои Гильдии
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {guild ? (
                        <Link href={`/guilds/${guild.tag}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-[10px] border border-white/10 shadow-lg">
                                {(guild.tag || guild.name.slice(0, 2)).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-primary transition-colors">{guild.name}</h4>
                                <p className="text-[10px] text-gray-500">[{guild.tag}] Lvl {guild.level}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-xs italic">Нет гильдий</div>
                    )}
                </div>
            </div>

            {/* 3. Friends */}
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-lg bg-[#121217]/80">
                <div className="p-4 border-b border-white/5 bg-[#1C1C22]/30 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-green-400 text-lg">group</span>
                        Друзья
                    </h3>
                    {friends.length > 0 && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            {friends.filter(f => f.is_online).length} ON
                        </span>
                    )}
                </div>
                <div className="p-3 grid grid-cols-4 gap-2">
                    {friends.length > 0 ? friends.map(friend => (
                        <Link href={`/user/${friend.display_id}`} key={friend.id} className="relative group cursor-pointer" title={friend.username}>
                            <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border border-white/10 group-hover:border-primary transition-colors">
                                {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">{friend.username?.[0] || "?"}</div>
                                )}
                            </div>
                            {friend.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121217]"></div>}
                        </Link>
                    )) : (
                        <div className="col-span-4 text-center text-gray-500 text-xs py-2">Нет друзей</div>
                    )}
                </div>
            </div>
        </aside>
    );

    return (
        <PageLayout rightSidebar={RightSidebarContent} leftSidebar={<ProfileSidebar profileId={profile.display_id} />}>
            <div className="space-y-6 pb-12">
                {/* 1. Header Section */}
                <div className="w-full relative glass-panel rounded-2xl overflow-hidden group border-0 bg-[#121217] border border-white/5">
                    <div
                        className="h-72 w-full bg-cover bg-center relative"
                        style={{ backgroundImage: `url('${profile.banner_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDS6H6dyP5ANmQJfPNBfwbKpM15P8Xf9H_bJ1ldPn5WP0j55V-3T754IQ_F59-a_DbpOMIjtln7iwUPqS7C6fpS61bItFLELmCvqr4g0lQwDYw-Kgp-T2bn6IkNaKJw2Iaf9Ihro9ks1t-kRe46S5DXAezPI1sKAyXWMvbUY6mEpzT2P4IOPBXQNDTLEUeYKJfXnmnuafJvIGASNJEFE9SYMmiFT1MiknX9R0t1y5fRLlaUMMWfSgjZqUD9udjT4iJMM6qAm0evaDo"}' )` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-dark/50 to-background-dark/90"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 to-transparent"></div>
                    </div>

                    <div className="px-8 pb-8 -mt-24 relative flex items-end gap-6 z-10">
                        <div className="relative shrink-0">
                            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-primary via-purple-500 to-indigo-600 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#121217] relative bg-[#121217]">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-purple-600 text-white">{profile.username[0]}</div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-[#121217] rounded-full p-1.5 border border-white/10 shadow-lg" title={profile.is_online ? "Онлайн" : "Оффлайн"}>
                                <div className={`w-4 h-4 rounded-full border-2 border-[#121217] ${profile.is_online ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                            </div>
                        </div>

                        <div className="flex-1 mb-3">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg uppercase">
                                    {profile.nickname || profile.username}
                                </h1>
                                {profile.rank_tier && (
                                    <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider border border-yellow-400/30">
                                        {profile.rank_tier}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
                                <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                    {profile.level || 1} Уровень
                                </span>
                                <span className="text-purple-300 font-semibold drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">swords</span>
                                    #{String(profile.display_id).padStart(6, '0')}
                                </span>
                            </div>
                        </div>

                        {isOwnProfile ? (
                            <button className="mb-4 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-md">
                                <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                Редактировать
                            </button>
                        ) : (
                            <button className="mb-4 px-6 py-2.5 bg-primary hover:bg-primaryHover border border-primary/50 rounded-xl text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                Добавить
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Bio & Showcase */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">info</span> Обо мне
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap flex-1">
                                {profile.bio || "Пользователь предпочел остаться загадкой."}
                            </p>

                            {/* Gifts Placeholder */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">card_giftcard</span> Подарки
                                </h3>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-600">
                                            <span className="material-symbols-outlined text-sm">redeem</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tower Progress */}
                    <div className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">castle</span> Башня
                            </h3>
                            <span className="text-xs font-bold px-2 py-1 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                                ЭТАЖ {((profile as any).tower_floor || 1)}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {towerLevels.length > 0 ? towerLevels.map((level) => {
                                const isCurrent = level.floor_number === ((profile as any).tower_floor || 1);
                                const isPassed = level.floor_number < ((profile as any).tower_floor || 1);
                                return (
                                    <div key={level.floor_number} className={`relative p-3 rounded-xl border transition-all ${isCurrent ? "bg-purple-900/10 border-purple-500/50" : "bg-[#1C1C22]/50 border-white/5 opacity-60"}`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`font-mono font-bold ${isCurrent ? "text-purple-400" : "text-gray-600"}`}>LVL {level.floor_number}</span>
                                            {isCurrent && <span className="material-symbols-outlined text-purple-500 text-sm animate-pulse">my_location</span>}
                                            {isPassed && <span className="material-symbols-outlined text-green-500 text-sm">check</span>}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-gray-500 text-xs py-4">Нет данных о башне</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card Showcase - Full Width now below Grid */}
                <div className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-400">style</span> Коллекция Карт
                        </h3>
                        <button className="px-3 py-1 bg-[#1C1C22] border border-white/10 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors">
                            Управление
                        </button>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {inventory.length > 0 ? inventory.slice(0, 6).map((slot, i) => (
                            <div key={i} className="aspect-[3/4] rounded-lg bg-gray-800 relative border overflow-hidden group hover:-translate-y-1 transition-transform border-gray-600">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${slot.items?.image_url || ""}')` }}></div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                                    <p className="text-[9px] font-bold text-yellow-400 uppercase text-center">{slot.items?.rarity || "COMMON"}</p>
                                    <p className="text-[10px] font-bold text-white text-center truncate">{slot.items?.name}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-8 text-center flex flex-col items-center justify-center text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">style</span>
                                <p className="text-sm">Коллекция пуста</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Reading Now */}
                <div className="glass-panel border border-white/5 rounded-2xl p-6 bg-[#121217]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">auto_stories</span>
                            Читаю сейчас
                        </h3>
                        <a className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1" href="#">
                            ВСЯ БИБЛИОТЕКА <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                    {/* Empty State / Real Data Placeholder */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="col-span-full py-8 text-center flex flex-col items-center justify-center text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">menu_book</span>
                            <p className="text-sm">История чтения пуста</p>
                        </div>
                    </div>
                </div>

                {/* 5. Hall of Fame */}
                <div className="glass-panel border border-white/5 rounded-2xl p-6 bg-[#121217]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-400">military_tech</span>
                            Зал Славы
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: "Новичок", sub: "Регистрация", color: "gray", icon: "person", rarity: "Обычное" },
                        ].map((item, i) => (
                            <div key={i} className="bg-[#1C1C22]/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group cursor-help relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1.5">
                                    <span className={`text-[10px] font-bold text-${item.color}-400 bg-${item.color}-500/10 px-1.5 py-0.5 rounded border border-${item.color}-500/20`}>{item.rarity}</span>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#121217] border border-white/10 flex items-center justify-center shrink-0">
                                    <span className={`material-symbols-outlined text-2xl text-${item.color}-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>{item.icon}</span>
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold text-white group-hover:text-${item.color}-400 transition-colors`}>{item.title}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Wall */}
                <div className="glass-panel border border-white/5 rounded-2xl p-6 bg-[#121217]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">forum</span>
                            Стена
                        </h3>
                        <span className="text-xs text-gray-500">{wallPosts.length} сообщений</span>
                    </div>

                    {/* Input Area */}
                    {currentUser ? (
                        <div className="flex gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-[#1C1C22] overflow-hidden shrink-0 border border-white/10">
                                {currentUser.avatar_url ? (
                                    <img src={currentUser.avatar_url} alt="My Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-purple-600">{currentUser.username?.[0] || "U"}</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    className="w-full bg-[#1C1C22]/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-20"
                                    placeholder="Написать сообщение..."
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    maxLength={500}
                                ></textarea>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-gray-600">{newPostContent.length}/500</span>
                                    <button
                                        className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handlePostComment}
                                        disabled={!newPostContent.trim() || isPosting}
                                    >
                                        {isPosting ? 'Отправка...' : 'Отправить'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 p-4 bg-white/5 rounded-xl text-center text-sm text-gray-400">
                            Войдите, чтобы оставлять сообщения
                        </div>
                    )}

                    {/* Posts List */}
                    <div className="space-y-4">
                        {wallPosts.length > 0 ? (
                            wallPosts.map((post) => (
                                <div key={post.id} className="flex gap-4 p-4 rounded-xl bg-[#1C1C22]/30 border border-white/5 group hover:bg-[#1C1C22]/50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-[#1C1C22] overflow-hidden shrink-0 border border-white/10 cursor-pointer">
                                        {/* Author Avatar */}
                                        {post.author?.avatar_url ? (
                                            <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-purple-600">{post.author?.username?.[0] || "?"}</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <Link href={`/user/${post.author?.display_id}`} className="text-sm font-bold text-white hover:text-primary transition-colors">
                                                    {post.author?.nickname || post.author?.username || "Unknown"}
                                                </Link>
                                                <div className="text-[10px] text-gray-500">
                                                    {new Date(post.created_at).toLocaleDateString()} в {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {/* Delete button */}
                                            {(currentUser?.id === post.author_id || currentUser?.id === profile.id) && (
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Удалить"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 text-sm py-8">
                                Стена пока пуста
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
