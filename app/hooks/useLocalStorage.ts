// Paikallisen tallennus hook. Synkronoi tiedot Elektronin tai selaimen säilöön.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const electron = getElectronStore();
    if (electron) {
      electron.storeGet!(key).then((stored) => {
        if (stored !== null && stored !== undefined) setValue(stored as T);
        setHydrated(true);
      });
    } else {
      try {
        const stored = localStorage.getItem(key);
        if (stored) setValue(JSON.parse(stored));
      } catch {
        null;
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
