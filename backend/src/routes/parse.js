import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { parseGeosite, parseGeoip } from '../parsers/v2ray-dat.js';
import { mrsToText, detectMrsBehavior } from '../parsers/mihomo-mrs.js';

const TMP_DIR = process.env.TMP_DIR || '/tmp/geodat';
const router = Router();

// In-memory cache for parsed results (sessionId -> full parse result)
const parseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function setCached(sessionId, data) {
  parseCache.set(sessionId, { data, ts: Date.now() });
}

function getCached(sessionId) {
  const entry = parseCache.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    parseCache.delete(sessionId);
    return null;
  }
  return entry.data;
}

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of parseCache) {
    if (now - entry.ts > CACHE_TTL) parseCache.delete(key);
  }
}, 10 * 60 * 1000);

async function parseFileFromDisk(sessionId, filename) {
  const safeSession = path.basename(sessionId);
  const safeFilename = path.basename(filename);
  const filePath = path.join(TMP_DIR, safeSession, safeFilename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(safeFilename).toLowerCase();
  const baseName = path.basename(safeFilename, ext).toLowerCase();

  let result;

    if (ext === '.dat') {
      // V2Ray format
      if (baseName.includes('geosite')) {
        const categories = await parseGeosite(buffer);
        result = {
          format: 'v2ray',
          type: 'geosite',
          categories: categories.map(c => ({
            tag: c.tag,
            count: c.domains.length,
            domains: c.domains
          }))
        };
      } else if (baseName.includes('geoip')) {
        const categories = await parseGeoip(buffer);
        result = {
          format: 'v2ray',
          type: 'geoip',
          categories: categories.map(c => ({
            tag: c.tag,
            count: c.cidrs.length,
            cidrs: c.cidrs
          }))
        };
      } else {
        // Try geosite first, fallback to geoip
        try {
          const categories = await parseGeosite(buffer);
          result = {
            format: 'v2ray',
            type: 'geosite',
            categories: categories.map(c => ({
              tag: c.tag,
              count: c.domains.length,
              domains: c.domains
            }))
          };
        } catch {
          const categories = await parseGeoip(buffer);
          result = {
            format: 'v2ray',
            type: 'geoip',
            categories: categories.map(c => ({
              tag: c.tag,
              count: c.cidrs.length,
              cidrs: c.cidrs
            }))
          };
        }
      }
    } else if (ext === '.mrs') {
      // Mihomo MRS format
      let behavior;
      try {
        const info = await detectMrsBehavior(buffer);
        behavior = info.behavior;
      } catch {
        behavior = 'domain'; // default guess
      }

      const text = await mrsToText(buffer, behavior);
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      result = {
        format: 'mrs',
        type: behavior,
        categories: [{
          tag: baseName,
          count: lines.length,
          ...(behavior === 'domain'
            ? { domains: lines.map(l => ({ type: 'RootDomain', value: l })) }
            : { cidrs: lines })
        }]
      };
    } else if (ext === '.txt' || ext === '.yaml' || ext === '.yml') {
      // Text format - simple domain/IP list
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

      // Detect if it's domains or IPs
      const hasIPs = lines.some(l => l.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/));
      const type = hasIPs ? 'ipcidr' : 'domain';

      result = {
        format: 'text',
        type,
        categories: [{
          tag: baseName,
          count: lines.length,
          ...(type === 'domain'
            ? { domains: lines.map(l => ({ type: 'RootDomain', value: l })) }
            : { cidrs: lines })
        }]
      };
    } else {
      return res.status(400).json({ error: `Unsupported format: ${ext}` });
    }

    return result;
}

router.post('/', async (req, res) => {
  try {
    const { sessionId, filename } = req.body;
    if (!sessionId || !filename) {
      return res.status(400).json({ error: 'sessionId and filename required' });
    }

    const result = await parseFileFromDisk(sessionId, filename);
    if (!result) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Cache full result
    setCached(sessionId, result);

    // Return summary only (no rules) for fast initial load
    const summary = {
      format: result.format,
      type: result.type,
      categories: result.categories.map(c => ({
        tag: c.tag,
        count: c.count
      }))
    };

    res.json(summary);
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch rules for a specific category
router.post('/rules', async (req, res) => {
  try {
    const { sessionId, filename, categoryIndex } = req.body;
    if (!sessionId || categoryIndex === undefined) {
      return res.status(400).json({ error: 'sessionId and categoryIndex required' });
    }

    let data = getCached(sessionId);
    if (!data && filename) {
      data = await parseFileFromDisk(sessionId, filename);
      if (data) setCached(sessionId, data);
    }
    if (!data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const idx = parseInt(categoryIndex, 10);
    if (idx < 0 || idx >= data.categories.length) {
      return res.status(400).json({ error: 'Invalid category index' });
    }

    const cat = data.categories[idx];
    res.json({
      tag: cat.tag,
      count: cat.count,
      ...(cat.domains ? { domains: cat.domains } : {}),
      ...(cat.cidrs ? { cidrs: cat.cidrs } : {})
    });
  } catch (err) {
    console.error('Rules fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
