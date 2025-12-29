/**
 * Shortcut type definition
 */
export interface Shortcut {
    id: string;
    name: string;
    type: 'website' | 'app';
    target: string;
    icon?: string;
    createdAt: number;
}

/**
 * Type definitions for the preload API exposed via contextBridge
 */
interface SearchWidgetAPI {
    // Search
    executeSearch: (query: string) => Promise<void>;

    // Window
    hideWindow: () => Promise<void>;
    onWindowShown: (callback: () => void) => void;
    onWindowHiding: (callback: () => void) => void;
    removeAllListeners: () => void;
    expandWindow: () => Promise<void>;
    collapseWindow: () => Promise<void>;

    // Shortcuts
    getShortcuts: () => Promise<Shortcut[]>;
    searchShortcuts: (query: string) => Promise<Shortcut[]>;
    addShortcut: (shortcut: Omit<Shortcut, 'id' | 'createdAt'>) => Promise<{ success: boolean; shortcut?: Shortcut; error?: string }>;
    updateShortcut: (id: string, updates: Partial<Omit<Shortcut, 'id' | 'createdAt'>>) => Promise<{ success: boolean; shortcut?: Shortcut; error?: string }>;
    deleteShortcut: (id: string) => Promise<boolean>;
    executeShortcut: (shortcut: Shortcut) => Promise<{ success: boolean; error?: string }>;
    selectAppFile: () => Promise<string | null>;

    // Settings
    getSettings: () => Promise<AppSettings>;
    updateSettings: (updates: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>;

    // App control
    quitApp: () => Promise<void>;
}

/**
 * App settings type
 */
export interface AppSettings {
    theme: 'dark' | 'light' | 'violet';
    shortcut: string;
}

declare global {
    interface Window {
        searchWidget: SearchWidgetAPI;
    }
}

export { };
