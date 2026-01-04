import { useState, useEffect } from 'react';
import { useLocalStorage } from '@marcella/storage';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [theme, setTheme] = useLocalStorage('app.theme', 'light');

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('API not available'));
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">My App</h1>
        <p className="text-lg mb-8">{message}</p>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme ({theme})
        </button>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">Getting Started</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Edit <code>packages/api/src/index.js</code> for API routes</li>
            <li>Edit <code>packages/dashboard/src/App.jsx</code> for frontend</li>
            <li>Configure D1 database in <code>packages/api/wrangler.toml</code></li>
            <li>Run <code>npm run dev</code> to start development</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
