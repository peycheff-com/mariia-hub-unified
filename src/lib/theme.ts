import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    hero: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Theme configurations
const themes: Record<Theme, ThemeConfig> = {
  light: {
    colors: {
      primary: '#8B4513', // Cocoa
      secondary: '#F5DEB3', // Champagne
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#1F2937', // Charcoal
      textSecondary: '#64748B',
      border: '#E5E7EB',
      accent: '#D4A574', // Rose Gold
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      secondary: 'linear-gradient(135deg, #F5DEB3 0%, #F8EAD4 100%)',
      hero: 'linear-gradient(135deg, #8B4513 0%, #D4A574 50%, #F5DEB3 100%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.07)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
  },
  dark: {
    colors: {
      primary: '#F5DEB3', // Champagne as primary in dark
      secondary: '#8B4513', // Cocoa as secondary
      background: '#1F2937', // Charcoal
      surface: '#374151',
      text: '#FAFAFA',
      textSecondary: '#D1D5DB',
      border: '#4B5563',
      accent: '#E8B78E', // Lighter Rose Gold
      error: '#F87171',
      warning: '#FBBF24',
      success: '#34D399',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #F5DEB3 0%, #E8B78E 100%)',
      secondary: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      hero: 'linear-gradient(135deg, #F5DEB3 0%, #8B4513 50%, #374151 100%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.25)',
      md: '0 4px 6px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    },
  },
  system: {
    // System theme will be resolved to light or dark
    ...themes.light, // Default to light
  },
};

// Theme context
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_STORAGE_KEY = 'theme-preference';
const THEME_TRANSITION_DURATION = 300; // ms

// Hook for system theme detection
function useSystemTheme(): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Initial check
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return systemTheme;
}

// Hook for managing theme
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  });

  const systemTheme = useSystemTheme();

  // Resolve actual theme (light or dark)
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';
  const config = themes[resolvedTheme];

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = config.colors;

    // Apply theme variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply gradient variables
    Object.entries(config.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });

    // Apply shadow variables
    Object.entries(config.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Set theme attribute
    root.setAttribute('data-theme', resolvedTheme);

    // Smooth transition
    root.style.setProperty('theme-transition', `${THEME_TRANSITION_DURATION}ms`);

    // Set transition for color scheme changes
    const transitionStyle = document.createElement('style');
    transitionStyle.textContent = `
      * {
        transition: background-color ${THEME_TRANSITION_DURATION}ms ease,
                    border-color ${THEME_TRANSITION_DURATION}ms ease,
                    color ${THEME_TRANSITION_DURATION}ms ease,
                    box-shadow ${THEME_TRANSITION_DURATION}ms ease !important;
      }
    `;
    document.head.appendChild(transitionStyle);

    // Remove transition after animation
    const timeout = setTimeout(() => {
      root.style.removeProperty('theme-transition');
      document.head.removeChild(transitionStyle);
    }, THEME_TRANSITION_DURATION);

    return () => clearTimeout(timeout);
  }, [resolvedTheme, config]);

  // Save theme preference
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Toggle including system option
  const cycleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    cycleTheme,
    isDark,
    config,
  };
}

// Theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeContext = useTheme();

  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for consuming theme context
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// Theme utilities
export const themeUtils = {
  // Get color value
  getColor: (colorName: string, theme: ThemeConfig) => {
    return theme.colors[colorName as keyof typeof theme.colors] || '';
  },

  // Get gradient value
  getGradient: (gradientName: string, theme: ThemeConfig) => {
    return theme.gradients[gradientName as keyof typeof theme.gradients] || '';
  },

  // Check if color is light or dark
  isLightColor: (hex: string): boolean => {
    const color = hex.replace('#', '');
    const rgb = parseInt(color, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5;
  },

  // Mix two colors
  mixColors: (color1: string, color2: string, ratio: number = 0.5): string => {
    const c1 = parseInt(color1.replace('#', ''), 16);
    const c2 = parseInt(color2.replace('#', ''), 16);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 >> 0 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 >> 0 & 0xff;

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'))}`;
  },
};

// Export current theme configuration for use in other files
export function getCurrentThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') return themes.light;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const resolvedTheme = stored === 'system' ? systemTheme : (stored || systemTheme);

  return themes[resolvedTheme] || themes.light;
}