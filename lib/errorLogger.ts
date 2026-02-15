// =====================================================
// GLOBAL ERROR LOGGER
// Captures all errors across the site and stores them
// =====================================================

export interface ErrorLogEntry {
    id: string;
    timestamp: string;
    type: 'console' | 'unhandled' | 'rpc' | 'fetch' | 'render' | 'custom';
    source: string; // page/component where the error occurred
    message: string;
    details?: string;
    code?: string;
    hint?: string;
    stack?: string;
    url?: string;
}

const MAX_LOGS = 500;
const STORAGE_KEY = 'yamiko_error_logs';

// Get all stored logs
export function getErrorLogs(): ErrorLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save logs to storage
function saveLogs(logs: ErrorLogEntry[]) {
    if (typeof window === 'undefined') return;
    try {
        // Keep only last MAX_LOGS entries
        const trimmed = logs.slice(-MAX_LOGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // Storage full? Clear old logs
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Add a new error log
export function logError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): ErrorLogEntry {
    const fullEntry: ErrorLogEntry = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        ...entry,
    };

    const logs = getErrorLogs();
    logs.push(fullEntry);
    saveLogs(logs);

    // Also log to console with full details for debugging
    console.warn(`[YAMIKO ERROR LOG] [${fullEntry.type}] ${fullEntry.source}: ${fullEntry.message}`, {
        details: fullEntry.details,
        code: fullEntry.code,
        hint: fullEntry.hint,
    });

    // Dispatch custom event so admin panel can update in real-time
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yamiko-error', { detail: fullEntry }));
    }

    return fullEntry;
}

// Log a Supabase RPC error with full details
export function logSupabaseError(
    source: string,
    error: { message?: string; code?: string; details?: string; hint?: string } | null,
    rpcName?: string
) {
    if (!error) return;
    logError({
        type: 'rpc',
        source,
        message: error.message || 'Unknown Supabase error',
        details: error.details || (rpcName ? `RPC: ${rpcName}` : undefined),
        code: error.code,
        hint: error.hint,
    });
}

// Clear all logs
export function clearErrorLogs() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('yamiko-error-clear'));
}

// Initialize global error capture
export function initGlobalErrorCapture() {
    if (typeof window === 'undefined') return;

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
        logError({
            type: 'unhandled',
            source: event.filename || 'unknown',
            message: event.message || 'Unhandled error',
            stack: event.error?.stack,
            url: window.location.pathname,
        });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        logError({
            type: 'unhandled',
            source: 'Promise',
            message: reason?.message || String(reason) || 'Unhandled promise rejection',
            stack: reason?.stack,
            details: reason?.details,
            code: reason?.code,
            url: window.location.pathname,
        });
    });

    // Intercept console.error to capture all errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        // Don't intercept our own logs
        if (typeof args[0] === 'string' && args[0].startsWith('[YAMIKO ERROR LOG]')) {
            originalConsoleError.apply(console, args);
            return;
        }

        // Parse error from args
        let message = '';
        let details = '';
        let code = '';
        let hint = '';

        for (const arg of args) {
            if (arg && typeof arg === 'object') {
                // Supabase error object
                if (arg.message) message = message || arg.message;
                if (arg.code) code = arg.code;
                if (arg.details) details = arg.details;
                if (arg.hint) hint = arg.hint;
                // If it's an Error instance
                if (arg instanceof Error) {
                    message = message || arg.message;
                }
            } else if (typeof arg === 'string') {
                message = message ? `${message} ${arg}` : arg;
            }
        }

        if (!message) {
            try {
                message = args.map(a => {
                    if (typeof a === 'object') return JSON.stringify(a);
                    return String(a);
                }).join(' ');
            } catch {
                message = 'Unknown console.error';
            }
        }

        logError({
            type: 'console',
            source: window.location.pathname,
            message,
            details: details || undefined,
            code: code || undefined,
            hint: hint || undefined,
            url: window.location.pathname,
        });

        // Call original
        originalConsoleError.apply(console, args);
    };
}
