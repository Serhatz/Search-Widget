import React, { useEffect, useState, createContext, useContext } from 'react';
import SearchBar from './components/SearchBar';
import { AppSettings } from './types/global';

// Theme context
interface ThemeContextType {
    theme: AppSettings['theme'];
    setTheme: (theme: AppSettings['theme']) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const App: React.FC = () => {
    const [theme, setTheme] = useState<AppSettings['theme']>('dark');

    // Load theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const settings = await window.searchWidget.getSettings();
                setTheme(settings.theme);
                document.documentElement.setAttribute('data-theme', settings.theme);
            } catch (error) {
                console.error('Failed to load theme:', error);
            }
        };
        loadTheme();
    }, []);

    // Apply theme when it changes
    const handleSetTheme = (newTheme: AppSettings['theme']) => {
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
            <div className="app">
                <SearchBar />
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
