interface LoadingButtonProps {
    loading: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export function LoadingButton({ loading, onClick, disabled }: LoadingButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        px-8 py-3 bg-surface-highlight-dark border border-white/5 rounded-full text-sm font-bold text-white 
        transition-all shadow-lg flex items-center gap-2 group
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:shadow-primary/20'}
      `}
        >
            {loading && (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            )}
            {loading ? 'Загрузка...' : 'Загрузить еще'}
        </button>
    );
}
