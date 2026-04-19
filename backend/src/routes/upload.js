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

export default router;
