/**
 * @marcella/storage
 * React hooks for persistent state using localStorage
 * with SSR safety and cross-tab synchronization
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Options for useLocalStorage hook
 */
export interface UseLocalStorageOptions<T> {
  /**
   * Custom serialization function (default: JSON.stringify)
   */
  serialize?: (value: T) => string;

  /**
   * Custom deserialization function (default: JSON.parse)
   */
  deserialize?: (value: string) => T;
}

/**
 * Return type matches useState for drop-in compatibility
 */
export type UseLocalStorageReturn<T> = [T, (value: T | ((prev: T) => T)) => void];

/**
 * Check if localStorage is available and accessible
 * Returns false for SSR, disabled localStorage, or quota issues
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * React hook for persistent state using localStorage
 *
 * Features:
 * - Drop-in replacement for useState
 * - SSR-safe (returns defaults when window is undefined)
 * - Cross-tab synchronization via storage events
 * - Custom serialization/deserialization
 * - Graceful error handling (quota exceeded, disabled storage)
 *
 * @template T - Type of the stored value
 * @param key - localStorage key (use namespaced keys like 'app.feature.setting')
 * @param defaultValue - Default value when no stored value exists
 * @param options - Optional configuration for serialization
 * @returns Tuple of [storedValue, setValue] matching useState API
 *
 * @example Basic usage
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('app.theme', 'light');
 * setTheme('dark'); // Persists to localStorage and updates state
 * ```
 *
 * @example With functional updates
 * ```tsx
 * const [count, setCount] = useLocalStorage('app.count', 0);
 * setCount(prev => prev + 1); // Works like useState
 * ```
 *
 * @example With custom serialization
 * ```tsx
 * const [date, setDate] = useLocalStorage('app.lastVisit', new Date(), {
 *   serialize: (d) => d.toISOString(),
 *   deserialize: (s) => new Date(s)
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serialize = (value: T) => JSON.stringify(value),
    deserialize = (value: string) => JSON.parse(value) as T,
  } = options;

  // Read initial value from localStorage
  const readValue = useCallback((): T => {
    if (!isLocalStorageAvailable()) {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Sync state with localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (isLocalStorageAvailable()) {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serialize]
  );

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [storedValue, setValue];
}

/**
 * Clear a specific key from localStorage
 */
export function clearLocalStorage(key: string): void {
  if (isLocalStorageAvailable()) {
    window.localStorage.removeItem(key);
  }
}

/**
 * Clear all keys matching a prefix from localStorage
 *
 * @example
 * ```ts
 * // Clear all keys starting with 'app.'
 * clearLocalStoragePrefix('app.');
 * ```
 */
export function clearLocalStoragePrefix(prefix: string): void {
  if (!isLocalStorageAvailable()) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}
