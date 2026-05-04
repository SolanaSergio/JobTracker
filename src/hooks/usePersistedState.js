import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useState that persists to localStorage.
 *
 *   const [view, setView] = usePersistedState('apps:view', 'board');
 */
export function usePersistedState(key, initialValue) {
  const fullKey = `jobtracker:${key}`;
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw == null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(fullKey);
  keyRef.current = fullKey;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      /* quota / serialization — ignore */
    }
  }, [value]);

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(keyRef.current); } catch {}
    setValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, reset];
}
