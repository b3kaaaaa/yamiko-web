import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { RecentActivityItem, WikiEntityType } from '@/types/wiki';

const getTypeColor = (type: WikiEntityType) => {
    switch (type) {
        case 'character': return 'indigo';
        case 'location': return 'green';
        case 'artifact': return 'yellow';
        case 'faction': return 'red';
        case 'world': return 'purple';
        default: return 'gray';
    }
};

export default function ActivityFeed({ activity = [] }: { activity: RecentActivityItem[] }) {
    return (
        <div className="py-2">
            {/* Header matches RightSidebar */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-xl animate-pulse">history</span>
                    Последние правки
                </h3>
            </div>

            {/* Minimalist Timeline */}
            <div className="space-y-6 relative ml-2 border-l border-white/5 pl-6 pb-2">
                {activity.map((item) => {
                    const color = getTypeColor(item.type);
                    const colorClass = color === 'indigo' ? 'text-indigo-400 bg-indigo-500' :
                        color === 'green' ? 'text-green-400 bg-green-500' :
                            color === 'yellow' ? 'text-yellow-400 bg-yellow-500' :
                                color === 'red' ? 'text-red-400 bg-red-500' :
                                    color === 'purple' ? 'text-purple-400 bg-purple-500' : 'text-gray-400 bg-gray-500';

                    return (
                        <div key={item.id} className="group relative">
                            {/* Dot on the timeline */}
                            <div className={`absolute -left-[27.5px] top-1.5 w-2 h-2 rounded-full border-2 border-surface-dark z-10 ${colorClass.split(' ')[1]}`}></div>

                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <Link href={`/manga/${item.manga_slug}`} className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${colorClass.split(' ')[0]} bg-white/5 hover:bg-white/10 transition-colors`}>
                                        {item.manga_title}
                                    </Link>
                                    <span className="text-[10px] text-gray-600 font-medium">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru })}
                                    </span>
                                </div>

                                <Link href={`/wiki/${item.id}`} className="text-xs font-bold text-gray-200 hover:text-primary transition-colors cursor-pointer leading-tight">
                                    {item.title}
                                </Link>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-4 h-4 rounded-full overflow-hidden bg-surface-highlight-dark border border-white/10">
                                        {item.avatar_url ? (
                                            <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">?</div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500">
                                        <span className="font-bold text-gray-400 hover:text-white transition-colors">{item.username}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {activity.length === 0 && (
                    <div className="text-gray-500 text-xs py-4">Нет недавних правок</div>
                )}
            </div>
        </div>
    );
}
