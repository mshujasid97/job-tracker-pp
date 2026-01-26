/**
 * Theme context for managing dark/light mode.
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Respects system preference on first visit
 * - Provides toggle function for switching themes
 * - Applies theme class to document root
 */

import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

/**
 * Get initial theme from localStorage or system preference.
 */
const getInitialTheme = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return savedTheme
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

/**
 * ThemeProvider wraps the app to provide theme state.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply theme to document root whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  /**
   * Toggle between light and dark themes.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * useTheme hook for accessing theme state.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}