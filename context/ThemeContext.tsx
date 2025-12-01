
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load from storage immediately to prevent flash/overwrite
    const savedTheme = localStorage.getItem('axc_theme') as Theme;
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Update body background when theme changes
  useEffect(() => {
    localStorage.setItem('axc_theme', theme);
    const root = window.document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = 'var(--color-neu-dark)';
      document.body.style.color = 'var(--color-neu-text-main-dark)';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = 'var(--color-neu-light)';
      document.body.style.color = 'var(--color-neu-text-main-light)';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
