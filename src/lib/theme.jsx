import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, resolvedTheme: 'light' });

function resolve(theme) {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return localStorage.getItem('jobtracker_theme') || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(theme));

  useEffect(() => {
    const r = resolve(theme);
    setResolvedTheme(r);
    const root = document.documentElement;
    root.classList.toggle('dark', r === 'dark');
    root.style.colorScheme = r;
  }, [theme]);

  // React to OS theme changes when set to "system"
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r = mq.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      const root = document.documentElement;
      root.classList.toggle('dark', r === 'dark');
      root.style.colorScheme = r;
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [theme]);

  const setTheme = (t) => {
    localStorage.setItem('jobtracker_theme', t);
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
