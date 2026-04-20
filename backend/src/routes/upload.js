import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = process.env.TMP_DIR || '/tmp/geodat';
const router = Router();

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionDir = path.join(TMP_DIR, uuidv4());
    fs.mkdirSync(sessionDir, { recursive: true });
    req.sessionDir = sessionDir;
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.dat', '.db', '.mrs', '.yaml', '.yml', '.txt', '.json'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  }
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const sessionId = path.basename(req.sessionDir);
  res.json({
    sessionId,
    filename: req.file.filename,
    size: req.file.size,
    path: req.file.path
  });
});

const ALLOWED_EXTENSIONS = ['.dat', '.db', '.mrs', '.yaml', '.yml', '.txt', '.json'];

// Serve raw file for client-side parsing
router.get('/raw/:sessionId/:filename', (req, res) => {
  const safeSession = path.basename(req.params.sessionId);
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(TMP_DIR, safeSession, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.set('Content-Type', 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

router.post('/from-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
    }

    // Extract filename from URL path
    const urlPath = parsed.pathname;
    const filename = path.basename(urlPath) || 'downloaded';
    const ext = path.extname(filename).toLowerCase();

    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: `Unsupported file format: "${ext || 'unknown'}". Supported: ${ALLOWED_EXTENSIONS.join(', ')}`
      });
    }

    // Fetch the file
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Geodat-Editor/1.0' },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Failed to download: HTTP ${response.status}` });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 50MB)' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Save to temp directory
    const sessionId = uuidv4();
    const sessionDir = path.join(TMP_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(sessionDir, safeName);
    fs.writeFileSync(filePath, buffer);

    res.json({
      sessionId,
      filename: safeName,
      originalName: filename,
      size: buffer.length
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(400).json({ error: 'Download timed out (30s)' });
    }
    console.error('URL fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
