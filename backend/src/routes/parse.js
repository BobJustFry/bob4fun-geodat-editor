import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { parseGeosite, parseGeoip } from '../parsers/v2ray-dat.js';
import { mrsToText, detectMrsBehavior } from '../parsers/mihomo-mrs.js';

const TMP_DIR = process.env.TMP_DIR || '/tmp/geodat';
const router = Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, filename } = req.body;
    if (!sessionId || !filename) {
      return res.status(400).json({ error: 'sessionId and filename required' });
    }

    // Sanitize
    const safeSession = path.basename(sessionId);
    const safeFilename = path.basename(filename);
    const filePath = path.join(TMP_DIR, safeSession, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
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

    res.json(result);
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
