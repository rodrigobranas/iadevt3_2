import { Hono, type Context, type ErrorHandler } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import fs from 'fs';
import path from 'path';
import products from './products';

dotenv.config();

// Initialize database on startup
initDatabase();

// Ensure uploads directory exists (backend/uploads/products)
const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = new Hono();
const PORT = Number(process.env.PORT) || 3005;

// CORS middleware
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173'], // Vite frontend
    credentials: true,
  })
);

app.get('/health', (c: Context) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount products router
app.route('/api/products', products);

// Serve static uploads (e.g., /uploads/products/<file>)
app.use('/uploads/*', serveStatic({ root: process.cwd() }));

// Error handler
const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error(err.stack);
  return c.json(
    {
      error: 'Something went wrong!',
      message: err.message,
    },
    500
  );
};

app.onError(errorHandler);

// Export the app for Bun's watch mode to handle server lifecycle
export default {
  fetch: app.fetch,
  port: PORT,
};
