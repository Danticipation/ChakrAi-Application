import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryMid: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentLight: string;
    background: string;
    surface: string;
    surfaceLight: string;
    text: string;
    textSecondary: string;
  };}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      primaryMid: '#1d4ed8',
      secondary: '#f1f5f9',
      secondaryLight: '#ffffff',
      secondaryDark: '#e2e8f0',
      accent: '#3b82f6',
      accentLight: '#93c5fd',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      surface: '#ffffff',
      surfaceLight: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b'
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#2d3748',
      primaryLight: '#4a5568',
      primaryDark: '#1a202c',
      primaryMid: '#374151',
      secondary: '#0f1419',
      secondaryLight: '#1f2937',
      secondaryDark: '#0a0f14',
      accent: '#667eea',
      accentLight: '#818cf8',
      background: '#0f1419',
      surface: '#1e2a3e',
      surfaceLight: '#2d3748',
      text: '#f7fafc',
      textSecondary: '#e2e8f0'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  changeTheme: (themeId: string) => void;
  isLightMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0] ?? { id: 'light', name: 'Light Mode', colors: { primary: '#3b82f6', primaryLight: '#60a5fa', primaryDark: '#2563eb', primaryMid: '#1d4ed8', secondary: '#f1f5f9', secondaryLight: '#ffffff', secondaryDark: '#e2e8f0', accent: '#3b82f6', accentLight: '#93c5fd', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', surface: '#ffffff', surfaceLight: '#f8fafc', text: '#1e293b', textSecondary: '#64748b' } });
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, [currentTheme]);

  const changeTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      setIsLightMode(theme.id === 'light');
    }
  };

  const toggleTheme = () => {
    const newThemeId = isLightMode ? 'dark' : 'light';
    changeTheme(newThemeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, isLightMode, toggleTheme }}>
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

