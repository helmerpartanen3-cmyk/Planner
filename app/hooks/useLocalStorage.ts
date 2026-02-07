"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Electron bridge types ───────────────────────────── */

interface ElectronAPI {
  storeGet?: (key: string) => Promise<unknown | null>;
  storeSet?: (key: string, value: unknown) => Promise<void>;
}

function getElectronStore(): ElectronAPI | null {
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).electronAPI) {
    const api = (window as unknown as Record<string, unknown>).electronAPI as ElectronAPI;
    if (api.storeGet && api.storeSet) return api;
  }
  return null;
}

/* ── Hook ────────────────────────────────────────────── */

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Read from store on mount
  useEffect(() => {
    const electron = getElectronStore();
    if (electron) {
      // Use Electron file store (AppData)
      electron.storeGet!(key).then((stored) => {
        if (stored !== null && stored !== undefined) setValue(stored as T);
        setHydrated(true);
      });
    } else {
      // Fallback to localStorage (browser / dev)
      try {
        const stored = localStorage.getItem(key);
        if (stored) setValue(JSON.parse(stored));
      } catch {
        /* ignore */
      }
      setHydrated(true);
    }
  }, [key]);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    const electron = getElectronStore();
    if (electron) {
      electron.storeSet!(key, value);
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
