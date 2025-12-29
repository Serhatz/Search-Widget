import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shortcut } from '../types/global';
import ShortcutsModal from './ShortcutsModal';
import '../styles/SearchBar.scss';

const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [matchedShortcut, setMatchedShortcut] = useState<Shortcut | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle window show/hide events from main process
    useEffect(() => {
        const handleWindowShown = () => {
            setIsVisible(true);
            setIsHiding(false);
            setQuery('');
            setMatchedShortcut(null);
            setShowSettings(false);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        };

        const handleWindowHiding = () => {
            setIsHiding(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsHiding(false);
            }, 200);
        };

        window.searchWidget.onWindowShown(handleWindowShown);
        window.searchWidget.onWindowHiding(handleWindowHiding);

        setIsVisible(true);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => {
            window.searchWidget.removeAllListeners();
        };
    }, []);

    // Search for matching shortcuts when query changes
    useEffect(() => {
        const searchShortcuts = async () => {
            if (!query.trim()) {
                setMatchedShortcut(null);
                return;
            }

            // Check for settings command
            if (query.trim().toLowerCase() === ':settings' || query.trim().toLowerCase() === ':ayarlar') {
                setMatchedShortcut(null);
                return;
            }

            const matches = await window.searchWidget.searchShortcuts(query.trim());
            // Only show exact match or single partial match
            const exactMatch = matches.find(s => s.name.toLowerCase() === query.trim().toLowerCase());
            setMatchedShortcut(exactMatch || (matches.length === 1 ? matches[0] : null));
        };

        searchShortcuts();
    }, [query]);

    const handleSearch = useCallback(async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // Check for settings command
        if (trimmedQuery.toLowerCase() === ':settings' || trimmedQuery.toLowerCase() === ':ayarlar') {
            setShowSettings(true);
            setQuery('');
            return;
        }

        // Check for shortcut match
        if (matchedShortcut) {
            try {
                await window.searchWidget.executeShortcut(matchedShortcut);
            } catch (error) {
                console.error('Shortcut execution failed:', error);
            }
            return;
        }

        // Default: web search
        try {
            await window.searchWidget.executeSearch(trimmedQuery);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }, [query, matchedShortcut]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (showSettings) {
                    setShowSettings(false);
                } else {
                    window.searchWidget.hideWindow();
                }
            }
        },
        [handleSearch, showSettings]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    return (
        <>
            <div
                className={`search-container ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''}`}
            >
                <div className={`search-bar ${matchedShortcut ? 'has-match' : ''}`}>
                    <div className="search-icon">
                        {matchedShortcut ? (
                            <span className="shortcut-type-icon">
                                {matchedShortcut.type === 'website' ? '🌐' : '🎮'}
                            </span>
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Ara veya kısayol yaz..."
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                    {matchedShortcut && (
                        <div className="shortcut-preview">
                            <span className="shortcut-target">
                                {matchedShortcut.type === 'website'
                                    ? matchedShortcut.target
                                    : matchedShortcut.target.split('\\').pop()}
                            </span>
                            <span className="enter-hint">↵</span>
                        </div>
                    )}
                    {!matchedShortcut && query && (
                        <button
                            className="clear-button"
                            onClick={() => {
                                setQuery('');
                                inputRef.current?.focus();
                            }}
                            tabIndex={-1}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                    <div className="shortcut-hint">
                        <span>:settings</span>
                    </div>
                </div>
            </div>

            <ShortcutsModal isOpen={showSettings} onClose={handleCloseSettings} />
        </>
    );
};

export default SearchBar;
