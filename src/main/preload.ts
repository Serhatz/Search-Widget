import { contextBridge, ipcRenderer } from 'electron';

/**
 * Shortcut type definition (must match main process)
 */
interface Shortcut {
    id: string;
    name: string;
    type: 'website' | 'app';
    target: string;
    icon?: string;
    createdAt: number;
}

/**
 * Secure IPC bridge for renderer process
 * Exposes only necessary methods with contextIsolation
 */
contextBridge.exposeInMainWorld('searchWidget', {
    // Search
    executeSearch: (query: string): Promise<void> => {
        return ipcRenderer.invoke('execute-search', query);
    },

    // Window
    hideWindow: (): Promise<void> => {
        return ipcRenderer.invoke('hide-window');
    },

    onWindowShown: (callback: () => void): void => {
        ipcRenderer.on('window-shown', () => callback());
    },

    onWindowHiding: (callback: () => void): void => {
        ipcRenderer.on('window-hiding', () => callback());
    },

    removeAllListeners: (): void => {
        ipcRenderer.removeAllListeners('window-shown');
        ipcRenderer.removeAllListeners('window-hiding');
    },

    expandWindow: (): Promise<void> => {
        return ipcRenderer.invoke('expand-window');
    },

    collapseWindow: (): Promise<void> => {
        return ipcRenderer.invoke('collapse-window');
    },

    // Shortcuts
    getShortcuts: (): Promise<Shortcut[]> => {
        return ipcRenderer.invoke('get-shortcuts');
    },

    searchShortcuts: (query: string): Promise<Shortcut[]> => {
        return ipcRenderer.invoke('search-shortcuts', query);
    },

    addShortcut: (shortcut: Omit<Shortcut, 'id' | 'createdAt'>): Promise<{ success: boolean; shortcut?: Shortcut; error?: string }> => {
        return ipcRenderer.invoke('add-shortcut', shortcut);
    },

    updateShortcut: (id: string, updates: Partial<Omit<Shortcut, 'id' | 'createdAt'>>): Promise<{ success: boolean; shortcut?: Shortcut; error?: string }> => {
        return ipcRenderer.invoke('update-shortcut', id, updates);
    },

    deleteShortcut: (id: string): Promise<boolean> => {
        return ipcRenderer.invoke('delete-shortcut', id);
    },

    executeShortcut: (shortcut: Shortcut): Promise<{ success: boolean; error?: string }> => {
        return ipcRenderer.invoke('execute-shortcut', shortcut);
    },

    selectAppFile: (): Promise<string | null> => {
        return ipcRenderer.invoke('select-app-file');
    },

    // Settings
    getSettings: (): Promise<{ theme: string; shortcut: string }> => {
        return ipcRenderer.invoke('get-settings');
    },

    updateSettings: (updates: { theme?: string; shortcut?: string }): Promise<{ success: boolean; error?: string }> => {
        return ipcRenderer.invoke('update-settings', updates);
    },

    // App control
    quitApp: (): Promise<void> => {
        return ipcRenderer.invoke('quit-app');
    },
});
