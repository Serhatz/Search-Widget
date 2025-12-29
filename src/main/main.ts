import {
    app,
    BrowserWindow,
    globalShortcut,
    ipcMain,
    shell,
    Tray,
    Menu,
    nativeImage,
    screen,
    dialog,
} from 'electron';
import * as path from 'path';
import { CONFIG } from './config';
import { shortcutsManager, Shortcut } from './shortcuts';
import { settingsManager, AppSettings } from './settings';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isVisible = false;
let isDialogOpen = false;  // Prevent hiding when dialog is open
let currentShortcut: string;

const isDev = !app.isPackaged;

function createWindow(): void {
    // Get primary display dimensions for centering
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: CONFIG.windowWidth,
        height: CONFIG.windowHeight,
        x: Math.round((screenWidth - CONFIG.windowWidth) / 2),
        y: Math.round(screenHeight / 4), // Position at 1/4 from top
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        show: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    // Load the renderer
    if (isDev) {
        mainWindow.loadURL(`http://localhost:${CONFIG.devPort}`);
        // Uncomment to open DevTools in development
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Hide window when it loses focus
    mainWindow.on('blur', () => {
        hideWindow();
    });
}

function showWindow(): void {
    if (!mainWindow) return;

    // Center window on active display
    const cursorPoint = screen.getCursorScreenPoint();
    const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const { x, y, width, height } = activeDisplay.workArea;

    const windowX = Math.round(x + (width - CONFIG.windowWidth) / 2);
    const windowY = Math.round(y + height / 4);

    mainWindow.setPosition(windowX, windowY);
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
    isVisible = true;
}

function hideWindow(): void {
    if (!mainWindow || !isVisible || isDialogOpen) return;

    mainWindow.webContents.send('window-hiding');

    // Small delay to allow fade-out animation
    setTimeout(() => {
        if (mainWindow) {
            mainWindow.hide();
        }
    }, CONFIG.animationDuration);

    isVisible = false;
}

function toggleWindow(): void {
    if (isVisible) {
        hideWindow();
    } else {
        showWindow();
    }
}

function createTray(): void {
    // Create a simple tray icon (16x16 white search icon)
    const iconPath = isDev
        ? path.join(__dirname, '../../assets/tray-icon.png')
        : path.join(process.resourcesPath, 'assets/tray-icon.png');

    // Create a simple icon if file doesn't exist
    let trayIcon: Electron.NativeImage;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) {
            throw new Error('Icon not found');
        }
    } catch {
        // Create a simple 16x16 icon as fallback
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon.isEmpty() ? createDefaultIcon() : trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Search Widget',
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Show (Alt+Space)',
            click: () => showWindow(),
        },
        { type: 'separator' },
        {
            label: 'Run at Startup',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked,
                });
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip('Search Widget - Press Ctrl+Space to search');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        toggleWindow();
    });
}

function createDefaultIcon(): Electron.NativeImage {
    // Create a simple 16x16 magnifying glass icon
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);

    // Fill with transparent
    for (let i = 0; i < canvas.length; i += 4) {
        canvas[i] = 255;     // R
        canvas[i + 1] = 255; // G
        canvas[i + 2] = 255; // B
        canvas[i + 3] = 0;   // A (transparent)
    }

    // Draw a simple circle for search icon
    const centerX = 6;
    const centerY = 6;
    const radius = 4;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Draw circle outline
            if (dist >= radius - 1 && dist <= radius + 1) {
                const idx = (y * size + x) * 4;
                canvas[idx] = 255;     // R
                canvas[idx + 1] = 255; // G
                canvas[idx + 2] = 255; // B
                canvas[idx + 3] = 255; // A
            }

            // Draw handle
            if (x >= 10 && x <= 14 && y >= 10 && y <= 14 && Math.abs(x - y) <= 1) {
                const idx = (y * size + x) * 4;
                canvas[idx] = 255;
                canvas[idx + 1] = 255;
                canvas[idx + 2] = 255;
                canvas[idx + 3] = 255;
            }
        }
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

function registerGlobalShortcut(): void {
    // Get shortcut from settings or use default
    currentShortcut = settingsManager.get('shortcut') || CONFIG.shortcut;

    const ret = globalShortcut.register(currentShortcut, () => {
        toggleWindow();
    });

    if (!ret) {
        console.error('Failed to register global shortcut:', currentShortcut);
        // Try fallback shortcut
        if (currentShortcut !== CONFIG.shortcut) {
            currentShortcut = CONFIG.shortcut;
            globalShortcut.register(currentShortcut, toggleWindow);
        }
    }
}

// IPC Handlers
ipcMain.handle('execute-search', async (_event, query: string) => {
    if (!query || typeof query !== 'string') return;

    const searchUrl = `${CONFIG.searchUrl}${encodeURIComponent(query.trim())}`;
    await shell.openExternal(searchUrl);
    hideWindow();
});

ipcMain.handle('hide-window', () => {
    hideWindow();
});

// Window resize for settings modal
ipcMain.handle('expand-window', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setSize(CONFIG.expandedWidth, CONFIG.expandedHeight);
    mainWindow.setPosition(x, y);
});

ipcMain.handle('collapse-window', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setSize(CONFIG.windowWidth, CONFIG.windowHeight);
    mainWindow.setPosition(x, y);
});
ipcMain.handle('get-shortcuts', () => {
    return shortcutsManager.getAll();
});

ipcMain.handle('search-shortcuts', (_event, query: string) => {
    return shortcutsManager.search(query);
});

ipcMain.handle('add-shortcut', (_event, shortcut: Omit<Shortcut, 'id' | 'createdAt'>) => {
    try {
        return { success: true, shortcut: shortcutsManager.add(shortcut) };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('update-shortcut', (_event, id: string, updates: Partial<Omit<Shortcut, 'id' | 'createdAt'>>) => {
    try {
        return { success: true, shortcut: shortcutsManager.update(id, updates) };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('delete-shortcut', (_event, id: string) => {
    return shortcutsManager.delete(id);
});

ipcMain.handle('execute-shortcut', async (_event, shortcut: Shortcut) => {
    try {
        if (shortcut.type === 'website') {
            // Open website in default browser
            let url = shortcut.target;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            await shell.openExternal(url);
        } else if (shortcut.type === 'app') {
            // Open application
            await shell.openPath(shortcut.target);
        }
        hideWindow();
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('select-app-file', async () => {
    if (!mainWindow) return null;

    isDialogOpen = true;  // Prevent window from hiding

    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Uygulama Seç',
        properties: ['openFile'],
        filters: [
            { name: 'Uygulamalar', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
            { name: 'Tüm Dosyalar', extensions: ['*'] }
        ]
    });

    isDialogOpen = false;  // Re-enable window hiding

    // Refocus the main window
    if (mainWindow) {
        mainWindow.focus();
    }

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

// Settings IPC Handlers
ipcMain.handle('get-settings', () => {
    return settingsManager.getAll();
});

ipcMain.handle('update-settings', (_event, updates: Partial<AppSettings>) => {
    const newSettings = settingsManager.update(updates);

    // If shortcut changed, re-register it
    if (updates.shortcut && updates.shortcut !== currentShortcut) {
        globalShortcut.unregister(currentShortcut);
        const success = globalShortcut.register(updates.shortcut, toggleWindow);
        if (success) {
            currentShortcut = updates.shortcut;
        } else {
            // Revert to old shortcut if registration failed
            globalShortcut.register(currentShortcut, toggleWindow);
            return { success: false, error: 'Kısayol kaydedilemedi' };
        }
    }

    return { success: true, settings: newSettings };
});

// Quit handler
ipcMain.handle('quit-app', () => {
    app.quit();
});

// Prevent multiple instances - must be before app.whenReady()
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Only show window if app is ready and window exists
        if (mainWindow) {
            showWindow();
        }
    });
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    createTray();
    registerGlobalShortcut();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    // Keep app running in tray
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

