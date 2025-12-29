import Store from 'electron-store';

/**
 * Application settings
 */
export interface AppSettings {
    theme: 'dark' | 'light' | 'violet';
    shortcut: string;
}

/**
 * Store schema
 */
interface SettingsStoreSchema {
    settings: AppSettings;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    shortcut: 'Alt+Space',
};

/**
 * Settings manager using electron-store
 */
class SettingsManager {
    private store: Store<SettingsStoreSchema>;

    constructor() {
        this.store = new Store<SettingsStoreSchema>({
            name: 'settings',
            defaults: {
                settings: DEFAULT_SETTINGS
            }
        });
    }

    /**
     * Get all settings
     */
    getAll(): AppSettings {
        return this.store.get('settings', DEFAULT_SETTINGS);
    }

    /**
     * Get a specific setting
     */
    get<K extends keyof AppSettings>(key: K): AppSettings[K] {
        const settings = this.getAll();
        return settings[key];
    }

    /**
     * Update settings
     */
    update(updates: Partial<AppSettings>): AppSettings {
        const current = this.getAll();
        const newSettings = { ...current, ...updates };
        this.store.set('settings', newSettings);
        return newSettings;
    }

    /**
     * Reset to defaults
     */
    reset(): AppSettings {
        this.store.set('settings', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }
}

// Singleton instance
export const settingsManager = new SettingsManager();
