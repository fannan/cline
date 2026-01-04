/**
 * Browser localStorage utilities with React hooks
 */

import { useState, useEffect, useCallback } from 'react';

// Default serialization functions
const defaultSerialize = (value) => JSON.stringify(value);
const defaultDeserialize = (value) => JSON.parse(value);

/**
 * Check if localStorage is available and accessible
 * Returns false for SSR, disabled localStorage, or quota issues
 */
function isLocalStorageAvailable() {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * React hook for persistent state using localStorage
 *
 * @template T
 * @param {string} key - localStorage key (use namespaced keys like 'app.feature.setting')
 * @param {T} defaultValue - Default value when no stored value exists
 * @param {Object} options - Optional configuration
 * @param {Function} options.serialize - Custom serialization function
 * @param {Function} options.deserialize - Custom deserialization function
 * @returns {[T, Function]} - Tuple of [storedValue, setValue] matching useState API
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('app.theme', 'light');
 * setTheme('dark'); // Persists to localStorage and updates state
 */
export function useLocalStorage(key, defaultValue, options = {}) {
  const {
    serialize = defaultSerialize,
    deserialize = defaultDeserialize
  } = options;

  // Read initial value from localStorage
  const readValue = useCallback(() => {
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

  const [storedValue, setStoredValue] = useState(readValue);

  // Sync state with localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    const handleStorageChange = (e) => {
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
