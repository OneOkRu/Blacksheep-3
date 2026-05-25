import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON body
  app.use(express.json({ limit: '20mb' }));

  // API Route to save the rating.json file
  app.post('/api/save', (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON data structure' });
      }

      const ratingPath = path.join(process.cwd(), 'public', 'data', 'rating.json');
      
      // Ensure data directory exists
      const dir = path.dirname(ratingPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(ratingPath, JSON.stringify(data, null, 2), 'utf-8');

      // Sync to dist if running under production build output
      const distRatingPath = path.join(process.cwd(), 'dist', 'data', 'rating.json');
      const distDir = path.dirname(distRatingPath);
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(distRatingPath, JSON.stringify(data, null, 2), 'utf-8');
      }

      // Clear standard Node cached modules if required (usually rating.json is read dynamically anyway)
      console.log(`Successfully saved updated rating.json to disk at ${ratingPath}`);
      return res.json({ success: true, message: 'Successfully saved to disk' });
    } catch (error: any) {
      console.error('Failed to save to disk:', error);
      return res.status(500).json({ error: error.message || 'Error occurred while saving rating.json' });
    }
  });

  // Serve static rating.json directly through API if needed, to avoid caching
  app.get('/data/rating.json', (req, res, next) => {
    const ratingPath = path.join(process.cwd(), 'public', 'data', 'rating.json');
    if (fs.existsSync(ratingPath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(ratingPath);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server start error:', err);
});
