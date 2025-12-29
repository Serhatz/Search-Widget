import React, { useState, useEffect, useCallback } from 'react';
import { Shortcut, AppSettings } from '../types/global';
import '../styles/ShortcutsModal.scss';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'shortcuts' | 'appearance' | 'hotkey';
type ShortcutType = 'website' | 'app';

interface FormData {
    name: string;
    type: ShortcutType;
    target: string;
}

const THEME_OPTIONS: { value: AppSettings['theme']; label: string; icon: string }[] = [
    { value: 'dark', label: 'Koyu', icon: '🌙' },
    { value: 'light', label: 'Açık', icon: '☀️' },
    { value: 'violet', label: 'Mor', icon: '💜' },
];

const SHORTCUT_OPTIONS = [
    'Alt+Space',
    'Ctrl+Space',
    'Ctrl+Shift+Space',
    'Alt+S',
    'Ctrl+Alt+Space',
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('shortcuts');
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ theme: 'dark', shortcut: 'Alt+Space' });
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({ name: '', type: 'website', target: '' });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Load data when modal opens
    const loadData = useCallback(async () => {
        const [shortcutsData, settingsData] = await Promise.all([
            window.searchWidget.getShortcuts(),
            window.searchWidget.getSettings()
        ]);
        setShortcuts(shortcutsData);
        setSettings(settingsData);
    }, []);

    useEffect(() => {
        if (isOpen) {
            window.searchWidget.expandWindow();
            loadData();
        } else {
            window.searchWidget.collapseWindow();
        }
    }, [isOpen, loadData]);

    const handleClose = useCallback(() => {
        window.searchWidget.collapseWindow();
        onClose();
    }, [onClose]);

    const resetForm = () => {
        setFormData({ name: '', type: 'website', target: '' });
        setIsAdding(false);
        setEditingId(null);
        setError(null);
    };

    const handleShortcutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim() || !formData.target.trim()) {
            setError('Tüm alanları doldurun');
            return;
        }

        try {
            if (editingId) {
                const result = await window.searchWidget.updateShortcut(editingId, formData);
                if (!result.success) {
                    setError(result.error || 'Güncelleme başarısız');
                    return;
                }
            } else {
                const result = await window.searchWidget.addShortcut(formData);
                if (!result.success) {
                    setError(result.error || 'Ekleme başarısız');
                    return;
                }
            }
            resetForm();
            loadData();
        } catch {
            setError('Bir hata oluştu');
        }
    };

    const handleEdit = (shortcut: Shortcut) => {
        setFormData({ name: shortcut.name, type: shortcut.type, target: shortcut.target });
        setEditingId(shortcut.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        await window.searchWidget.deleteShortcut(id);
        loadData();
    };

    const handleSelectApp = async () => {
        const filePath = await window.searchWidget.selectAppFile();
        if (filePath) {
            setFormData(prev => ({ ...prev, target: filePath }));
        }
    };

    const handleThemeChange = async (theme: AppSettings['theme']) => {
        setSaving(true);
        // Apply theme immediately for instant feedback
        document.documentElement.setAttribute('data-theme', theme);

        const result = await window.searchWidget.updateSettings({ theme });
        if (result.success) {
            setSettings(prev => ({ ...prev, theme }));
        } else {
            // Revert if failed
            document.documentElement.setAttribute('data-theme', settings.theme);
        }
        setSaving(false);
    };

    const handleHotkeyChange = async (shortcut: string) => {
        setSaving(true);
        setError(null);
        const result = await window.searchWidget.updateSettings({ shortcut });
        if (result.success) {
            setSettings(prev => ({ ...prev, shortcut }));
        } else {
            setError(result.error || 'Kısayol kaydedilemedi');
        }
        setSaving(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (isAdding) {
                resetForm();
            } else {
                handleClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="shortcuts-modal-overlay" onClick={handleClose} onKeyDown={handleKeyDown}>
            <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚙️ Ayarlar</h2>
                    <button className="close-btn" onClick={handleClose}>✕</button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={activeTab === 'shortcuts' ? 'active' : ''}
                        onClick={() => setActiveTab('shortcuts')}
                    >
                        📁 Kısayollar
                    </button>
                    <button
                        className={activeTab === 'appearance' ? 'active' : ''}
                        onClick={() => setActiveTab('appearance')}
                    >
                        🎨 Tema
                    </button>
                    <button
                        className={activeTab === 'hotkey' ? 'active' : ''}
                        onClick={() => setActiveTab('hotkey')}
                    >
                        ⌨️ Kısayol Tuşu
                    </button>
                </div>

                <div className="modal-content">
                    {/* Shortcuts Tab */}
                    {activeTab === 'shortcuts' && (
                        <>
                            <div className="shortcuts-list">
                                {shortcuts.length === 0 ? (
                                    <div className="empty-state">Henüz kısayol eklenmedi</div>
                                ) : (
                                    shortcuts.map(shortcut => (
                                        <div key={shortcut.id} className="shortcut-item">
                                            <span className="shortcut-icon">
                                                {shortcut.type === 'website' ? '🌐' : '🎮'}
                                            </span>
                                            <span className="shortcut-name">{shortcut.name}</span>
                                            <span className="shortcut-target" title={shortcut.target}>
                                                {shortcut.type === 'website'
                                                    ? shortcut.target
                                                    : shortcut.target.split('\\').pop()}
                                            </span>
                                            <div className="shortcut-actions">
                                                <button onClick={() => handleEdit(shortcut)}>✏️</button>
                                                <button onClick={() => handleDelete(shortcut.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {isAdding ? (
                                <form className="shortcut-form" onSubmit={handleShortcutSubmit}>
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            placeholder="Kısayol adı (örn: yt)"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-row type-toggle">
                                        <button
                                            type="button"
                                            className={formData.type === 'website' ? 'active' : ''}
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'website', target: '' }))}
                                        >
                                            🌐 Website
                                        </button>
                                        <button
                                            type="button"
                                            className={formData.type === 'app' ? 'active' : ''}
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'app', target: '' }))}
                                        >
                                            🎮 Uygulama
                                        </button>
                                    </div>
                                    <div className="form-row target-row">
                                        {formData.type === 'website' ? (
                                            <input
                                                type="text"
                                                placeholder="URL (örn: youtube.com)"
                                                value={formData.target}
                                                onChange={e => setFormData(prev => ({ ...prev, target: e.target.value }))}
                                            />
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Uygulama yolu"
                                                    value={formData.target}
                                                    readOnly
                                                />
                                                <button type="button" className="browse-btn" onClick={handleSelectApp}>
                                                    📂 Seç
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {error && <div className="form-error">{error}</div>}
                                    <div className="form-actions">
                                        <button type="button" className="cancel-btn" onClick={resetForm}>İptal</button>
                                        <button type="submit" className="save-btn">{editingId ? 'Güncelle' : 'Ekle'}</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="add-buttons">
                                    <button className="add-btn" onClick={() => { setIsAdding(true); setFormData(prev => ({ ...prev, type: 'website' })); }}>
                                        + Website Kısayolu
                                    </button>
                                    <button className="add-btn" onClick={() => { setIsAdding(true); setFormData(prev => ({ ...prev, type: 'app' })); }}>
                                        + Uygulama Kısayolu
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <h3>Tema Seçimi</h3>
                            <div className="theme-options">
                                {THEME_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        className={`theme-btn ${settings.theme === option.value ? 'active' : ''}`}
                                        onClick={() => handleThemeChange(option.value)}
                                        disabled={saving}
                                    >
                                        <span className="theme-icon">{option.icon}</span>
                                        <span className="theme-label">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hotkey Tab */}
                    {activeTab === 'hotkey' && (
                        <div className="settings-section">
                            <h3>Arama Açma Kısayolu</h3>
                            <p className="settings-hint">Arama çubuğunu açmak için kullanılacak tuş kombinasyonu</p>
                            <div className="hotkey-options">
                                {SHORTCUT_OPTIONS.map(option => (
                                    <button
                                        key={option}
                                        className={`hotkey-btn ${settings.shortcut === option ? 'active' : ''}`}
                                        onClick={() => handleHotkeyChange(option)}
                                        disabled={saving}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {error && <div className="form-error">{error}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
