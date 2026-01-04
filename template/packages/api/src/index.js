import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createD1Client } from '@cline/d1';

const app = new Hono();

// CORS configuration
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://your-app.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Database middleware (uncomment when D1 is configured)
// app.use('*', async (c, next) => {
//   c.set('db', createD1Client({ binding: c.env.DB }));
//   await next();
// });

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example API endpoint
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from your API!' });
});

// Example with database (uncomment when D1 is configured)
// app.get('/api/items', async (c) => {
//   const db = c.get('db');
//   const items = await db.queryAll('SELECT * FROM items ORDER BY created_at DESC');
//   return c.json(items);
// });

export default app;
