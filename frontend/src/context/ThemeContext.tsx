import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check for user preference or saved setting
  const [darkMode, setDarkMode] = useState(() => {
    try {
      // Check if there's a saved preference
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode) {
        return savedMode === 'true';
      }
      // Otherwise check for system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return false;
    }
  });

  useEffect(() => {
    // Update the document class when darkMode changes
    try {
      // In Tailwind v4, we need to add the dark class to the html element
      const htmlElement = document.documentElement;
      
      if (darkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      
      // Save preference to localStorage
      localStorage.setItem('darkMode', darkMode.toString());
      
      console.log('Dark mode updated:', darkMode, 'Classes:', htmlElement.classList.toString());
    } catch (error) {
      console.error('Error updating dark mode:', error);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    console.log('Toggling dark mode, current:', darkMode);
    setDarkMode((prev) => !prev);
  };

  const contextValue = {
    darkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 