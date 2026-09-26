import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('vce_theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vce_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeToggleButton: React.FC<{ id?: string; className?: string }> = ({
  id = 'btn-theme-switch-top',
  className = '',
}) => {
  const { toggleTheme } = useTheme();

  return (
    <button
      className={`btn-theme-toggle ${className}`}
      id={id}
      onClick={toggleTheme}
      title="Toggle Light / Dark Mode"
      aria-label="Toggle Theme"
      type="button"
    >
      <span className="theme-icon sun-icon">☀️</span>
      <span className="theme-icon moon-icon">🌙</span>
      <span className="theme-text">Mode</span>
    </button>
  );
};
