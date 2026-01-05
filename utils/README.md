# @cline/core/utils - Formatting Utilities

Reusable formatting functions for dashboards and data display.

## Usage

```javascript
import { formatAmount, formatTimeAgo } from '@cline/core/utils';

// Or import specific modules
import { formatAmount } from '@cline/core/utils/format';
import { formatTimeAgo } from '@cline/core/utils/date';
```

## API

### formatAmount(num, prefix?)

Format numbers with K/M suffixes.

```javascript
formatAmount(1500)         // "$1.5K"
formatAmount(2300000)      // "$2.3M"
formatAmount(500, '')      // "500"
formatAmount(1500, '€')    // "€1.5K"
```

### formatTimeAgo(dateInput, options?)

Format dates as relative time.

```javascript
formatTimeAgo('2025-01-05T12:00:00')  // "5m ago"
formatTimeAgo(new Date())              // "just now"
formatTimeAgo(null)                    // "-"
```

Options:
- `assumeUTC` (default: `true`) - Treat string input as UTC

### formatTimeAgoLong(dateInput, options?)

Extended version with weeks, months, years.

```javascript
formatTimeAgoLong(date, { short: true })   // "2w ago"
formatTimeAgoLong(date, { short: false })  // "2 weeks ago"
```

## Live Ticking Pattern

For real-time updates in React:

```jsx
import { useState, useEffect } from 'react';
import { formatTimeAgo } from '@cline/core/utils';

function LastUpdated({ timestamp }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span>{formatTimeAgo(timestamp)}</span>;
}
```
