import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import parseRouter from './routes/parse.js';
import convertRouter from './routes/convert.js';
import downloadRouter from './routes/download.js';
import { cleanupOldFiles } from './utils/cleanup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// API routes
app.use('/api/upload', uploadRouter);
app.use('/api/parse', parseRouter);
app.use('/api/convert', convertRouter);
app.use('/api/download', downloadRouter);

// Serve frontend
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Cleanup old temporary files every 10 minutes
setInterval(cleanupOldFiles, 10 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
