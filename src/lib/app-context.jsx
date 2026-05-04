import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [page, setPageState] = useState(() => {
    const hash = window.location.hash.replace('#/', '').split('?')[0];
    return hash || 'dashboard';
  });
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const navigate = useCallback((next) => {
    setPageState(next);
    window.history.replaceState(null, '', `#/${next}`);
  }, []);

  // sync hash → state on browser back/forward
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#/', '').split('?')[0];
      if (hash) setPageState(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // ⌘K / Ctrl+K — open command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      // Quick-add: c
      if (!commandOpen && !quickAddOpen && e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandOpen, quickAddOpen]);

  return (
    <AppContext.Provider value={{ page, navigate, commandOpen, setCommandOpen, quickAddOpen, setQuickAddOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
