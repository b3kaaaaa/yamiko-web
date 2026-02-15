import { FilterType, TimePeriod, FeedMode } from '../hooks/usePopularFeed';

interface PopularHeaderProps {
    filterType: FilterType;
    timePeriod: TimePeriod;
    feedMode: FeedMode;
    searchQuery: string;
    onFilterChange: (type: FilterType) => void;
    onTimePeriodChange: (period: TimePeriod) => void;
    onFeedModeChange: (mode: FeedMode) => void;
    onSearchChange: (query: string) => void;
}

export function PopularHeader({
    filterType,
    timePeriod,
    feedMode,
    searchQuery,
    onFilterChange,
    onTimePeriodChange,
    onFeedModeChange,
    onSearchChange
}: PopularHeaderProps) {
    return (
        <div className="flex flex-col gap-4 bg-surface-dark border border-white/5 rounded-2xl p-4 shadow-lg sticky top-20 z-40 backdrop-blur-md bg-opacity-95 mb-8">

            {/* Top Row: Title & Main Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-white mr-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_fire_department</span>
                        Популярное
                    </h1>
                    <div className="h-6 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

                    <button
                        onClick={() => onFilterChange('views')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${filterType === 'views'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primaryHover'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Просматриваемые
                    </button>

                    <button
                        onClick={() => onFilterChange('rating')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${filterType === 'rating'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primaryHover'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        Рейтинг
                    </button>

                    <button
                        onClick={() => onFilterChange('trending')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${filterType === 'trending'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primaryHover'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                        Тренды
                    </button>

                    {/* Time Period Dropdown (Simplified as toggle for now) */}
                    <select
                        value={timePeriod}
                        onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
                        className="ml-auto lg:ml-2 bg-surface-highlight-dark/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary/50"
                    >
                        <option value="7_days">За 7 дней</option>
                        <option value="30_days">За 30 дней</option>
                        <option value="all_time">За всё время</option>
                    </select>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                        <input
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-surface-highlight-dark border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:ring-1 focus:ring-primary focus:border-primary placeholder-gray-600 shadow-sm transition-all"
                            placeholder="Поиск..."
                            type="text"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Feed Modes */}
            <div className="flex items-center gap-2 border-t border-white/5 pt-4 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Лента:</span>

                <FeedTab
                    label="Общая"
                    active={feedMode === 'general'}
                    onClick={() => onFeedModeChange('general')}
                    icon="public"
                />
                <FeedTab
                    label="Для Вас"
                    active={feedMode === 'for_you'}
                    onClick={() => onFeedModeChange('for_you')}
                    icon="recommend"
                    color="text-primary"
                />
                <FeedTab
                    label="Для Парней"
                    active={feedMode === 'for_him'}
                    onClick={() => onFeedModeChange('for_him')}
                    icon="male"
                    color="text-blue-400"
                />
                <FeedTab
                    label="Для Девушек"
                    active={feedMode === 'for_her'}
                    onClick={() => onFeedModeChange('for_her')}
                    icon="female"
                    color="text-pink-400"
                />
            </div>
        </div>
    );
}

function FeedTab({ label, active, onClick, icon, color = 'text-gray-400' }: any) {
    return (
        <button
            onClick={onClick}
            className={`
        px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border
        ${active
                    ? 'bg-surface-highlight-dark border-primary/50 text-white shadow-lg shadow-primary/10'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }
      `}
        >
            <span className={`material-symbols-outlined text-[16px] ${active ? color : 'text-gray-500'}`}>{icon}</span>
            {label}
        </button>
    );
}
