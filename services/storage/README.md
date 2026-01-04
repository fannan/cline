# React localStorage Hook

Persistent state using localStorage with cross-tab synchronization.

## Installation

Copy this directory to your project:

```bash
cp -r services/storage your-project/packages/shared/storage
```

## Usage

```jsx
import { useLocalStorage } from '../shared/storage/index.js';

function FilterPanel() {
  const [filters, setFilters] = useLocalStorage('app.filters', {
    status: 'all',
    sortBy: 'date'
  });

  return (
    <select
      value={filters.status}
      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
    >
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="completed">Completed</option>
    </select>
  );
}
```

## Features

- **Persistent** - State survives page refreshes
- **SSR-safe** - Returns default value during server rendering
- **Cross-tab sync** - Changes in one tab appear in others
- **Function updates** - `setValue(prev => ...)` works like useState
- **Custom serialization** - Override JSON.stringify/parse if needed

## API

### `useLocalStorage(key, defaultValue, options?)`

| Param | Type | Description |
|-------|------|-------------|
| `key` | string | localStorage key (use namespaced keys like `app.feature.setting`) |
| `defaultValue` | T | Default value when no stored value exists |
| `options.serialize` | Function | Custom serialization (default: JSON.stringify) |
| `options.deserialize` | Function | Custom deserialization (default: JSON.parse) |

Returns `[value, setValue]` tuple, just like `useState`.
