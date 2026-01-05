import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    destructive: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [accentColor, setAccentColorState] = useState('#5b9bd5');

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('studyapp_darkMode');
      const savedAccentColor = await AsyncStorage.getItem('studyapp_accentColor');

      if (savedDarkMode !== null) {
        setIsDark(savedDarkMode === 'true');
      }

      if (savedAccentColor) {
        setAccentColorState(savedAccentColor);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  };

  const toggleDark = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem('studyapp_darkMode', newValue.toString());
    } catch (error) {
      console.error('Failed to save dark mode:', error);
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    try {
      await AsyncStorage.setItem('studyapp_accentColor', color);
    } catch (error) {
      console.error('Failed to save accent color:', error);
    }
  };

  const colors = {
    background: isDark ? '#000000' : '#ffffff',
    card: isDark ? '#1c1c1e' : '#f2f2f7',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#8e8e93' : '#8e8e93',
    border: isDark ? '#38383a' : '#c6c6c8',
    accent: accentColor,
    destructive: '#ff3b30',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, accentColor, setAccentColor, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
