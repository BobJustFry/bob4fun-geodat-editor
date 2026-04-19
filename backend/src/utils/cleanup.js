import fs from 'fs';
import path from 'path';

const TMP_DIR = process.env.TMP_DIR || '/tmp/geodat';

export function cleanupOldFiles() {
  const maxAge = 30 * 60 * 1000; // 30 minutes
  try {
    if (!fs.existsSync(TMP_DIR)) return;
    const entries = fs.readdirSync(TMP_DIR);
    const now = Date.now();
    for (const entry of entries) {
      const fullPath = path.join(TMP_DIR, entry);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAge) {
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}
