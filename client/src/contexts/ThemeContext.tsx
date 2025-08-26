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
  };
}

export const themes: Theme[] = [
  {
    id: 'blue',
    name: 'Midnight Luxury',
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
  },
  {
    id: 'lavender',
    name: 'Soft Lavender',
    colors: {
      primary: '#6b73c1',
      primaryLight: '#8b92d4',
      primaryDark: '#4c1d95',
      primaryMid: '#5b21b6',
      secondary: '#1e1b2e',
      secondaryLight: '#2d2540',
      secondaryDark: '#0f0d1a',
      accent: '#a78bfa',
      accentLight: '#c4b5fd',
      background: '#1e1b2e',
      surface: '#2d2540',
      surfaceLight: '#3f3653',
      text: '#f8fafc',
      textSecondary: '#e2e8f0'
    }
  },
  {
    id: 'teal',
    name: 'Ocean Depths',
    colors: {
      primary: '#0d9488',
      primaryLight: '#14b8a6',
      primaryDark: '#134e4a',
      primaryMid: '#0f766e',
      secondary: '#042f2e',
      secondaryLight: '#164e4b',
      secondaryDark: '#022321',
      accent: '#5eead4',
      accentLight: '#99f6e4',
      background: '#042f2e',
      surface: '#164e4b',
      surfaceLight: '#0f766e',
      text: '#f0fdfa',
      textSecondary: '#ccfbf1'
    }
  },
  {
    id: 'sage',
    name: 'Forest Luxury',
    colors: {
      primary: '#059669',
      primaryLight: '#10b981',
      primaryDark: '#064e3b',
      primaryMid: '#047857',
      secondary: '#022c22',
      secondaryLight: '#14532d',
      secondaryDark: '#021810',
      accent: '#6ee7b7',
      accentLight: '#a7f3d0',
      background: '#022c22',
      surface: '#14532d',
      surfaceLight: '#166534',
      text: '#f0fdf4',
      textSecondary: '#dcfce7'
    }
  },
  {
    id: 'rose',
    name: 'Sunset Rose',
    colors: {
      primary: '#e11d48',
      primaryLight: '#f43f5e',
      primaryDark: '#881337',
      primaryMid: '#be185d',
      secondary: '#4c0519',
      secondaryLight: '#7f1d3c',
      secondaryDark: '#2d0712',
      accent: '#fb7185',
      accentLight: '#fda4af',
      background: '#4c0519',
      surface: '#7f1d3c',
      surfaceLight: '#9f1239',
      text: '#fdf2f8',
      textSecondary: '#fce7f3'
    }
  },
  {
    id: 'amber',
    name: 'Warm Gold',
    colors: {
      primary: '#d97706',
      primaryLight: '#f59e0b',
      primaryDark: '#78350f',
      primaryMid: '#92400e',
      secondary: '#451a03',
      secondaryLight: '#713f12',
      secondaryDark: '#292524',
      accent: '#fbbf24',
      accentLight: '#fcd34d',
      background: '#451a03',
      surface: '#713f12',
      surfaceLight: '#92400e',
      text: '#fffbeb',
      textSecondary: '#fef3c7'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  changeTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => themes[0] as Theme); // Ocean Blue default

  useEffect(() => {
    // Load saved theme from localStorage on initial load
    const savedTheme = localStorage.getItem('chakrai-theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme colors to CSS custom properties whenever theme changes
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.colors.primary);
    root.style.setProperty('--theme-primary-light', currentTheme.colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', currentTheme.colors.primaryDark);
    root.style.setProperty('--theme-primary-mid', currentTheme.colors.primaryMid);
    root.style.setProperty('--theme-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--theme-secondary-light', currentTheme.colors.secondaryLight);
    root.style.setProperty('--theme-secondary-dark', currentTheme.colors.secondaryDark);
    root.style.setProperty('--theme-accent', currentTheme.colors.accent);
    root.style.setProperty('--theme-accent-light', currentTheme.colors.accentLight);
    root.style.setProperty('--theme-background', currentTheme.colors.background);
    root.style.setProperty('--theme-surface', currentTheme.colors.surface);
    root.style.setProperty('--theme-surface-light', currentTheme.colors.surfaceLight);
    root.style.setProperty('--theme-text', currentTheme.colors.text);
    root.style.setProperty('--theme-text-secondary', currentTheme.colors.textSecondary);
    
    // Progress bars always use red->yellow->green regardless of theme
    root.style.setProperty('--progress-start', '#ef4444'); // red-500
    root.style.setProperty('--progress-middle', '#eab308'); // yellow-500  
    root.style.setProperty('--progress-end', '#22c55e'); // green-500
    

  }, [currentTheme]);

  const changeTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('chakrai-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme }}>
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