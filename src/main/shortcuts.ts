import Store from 'electron-store';

/**
 * Shortcut type definition
 */
export interface Shortcut {
    id: string;
    name: string;           // Shortcut keyword (e.g., "yt", "valo")
    type: 'website' | 'app';
    target: string;         // URL or file path
    icon?: string;          // Optional icon path
    createdAt: number;
}

/**
 * Store schema
 */
interface StoreSchema {
    shortcuts: Shortcut[];
}

/**
 * Shortcuts storage manager using electron-store
 */
class ShortcutsManager {
    private store: Store<StoreSchema>;

    constructor() {
        this.store = new Store<StoreSchema>({
            name: 'shortcuts',
            defaults: {
                shortcuts: []
            }
        });
    }

    /**
     * Get all shortcuts
     */
    getAll(): Shortcut[] {
        return this.store.get('shortcuts', []);
    }

    /**
     * Get shortcut by name (case-insensitive)
     */
    getByName(name: string): Shortcut | undefined {
        const shortcuts = this.getAll();
        return shortcuts.find(s => s.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Add a new shortcut
     */
    add(shortcut: Omit<Shortcut, 'id' | 'createdAt'>): Shortcut {
        const shortcuts = this.getAll();

        // Check for duplicate name
        if (shortcuts.some(s => s.name.toLowerCase() === shortcut.name.toLowerCase())) {
            throw new Error(`Shortcut "${shortcut.name}" already exists`);
        }

        const newShortcut: Shortcut = {
            ...shortcut,
            id: this.generateId(),
            createdAt: Date.now()
        };

        shortcuts.push(newShortcut);
        this.store.set('shortcuts', shortcuts);

        return newShortcut;
    }

    /**
     * Update an existing shortcut
     */
    update(id: string, updates: Partial<Omit<Shortcut, 'id' | 'createdAt'>>): Shortcut {
        const shortcuts = this.getAll();
        const index = shortcuts.findIndex(s => s.id === id);

        if (index === -1) {
            throw new Error(`Shortcut with id "${id}" not found`);
        }

        // Check for duplicate name (excluding current shortcut)
        if (updates.name) {
            const duplicate = shortcuts.find(
                s => s.id !== id && s.name.toLowerCase() === updates.name!.toLowerCase()
            );
            if (duplicate) {
                throw new Error(`Shortcut "${updates.name}" already exists`);
            }
        }

        shortcuts[index] = { ...shortcuts[index], ...updates };
        this.store.set('shortcuts', shortcuts);

        return shortcuts[index];
    }

    /**
     * Delete a shortcut
     */
    delete(id: string): boolean {
        const shortcuts = this.getAll();
        const filtered = shortcuts.filter(s => s.id !== id);

        if (filtered.length === shortcuts.length) {
            return false;
        }

        this.store.set('shortcuts', filtered);
        return true;
    }

    /**
     * Search shortcuts by partial name match
     */
    search(query: string): Shortcut[] {
        if (!query) return [];

        const shortcuts = this.getAll();
        const lowerQuery = query.toLowerCase();

        return shortcuts.filter(s =>
            s.name.toLowerCase().startsWith(lowerQuery)
        );
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
export const shortcutsManager = new ShortcutsManager();
