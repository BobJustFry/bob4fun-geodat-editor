import { Router } from 'express';
import { buildGeosite, buildGeoip } from '../parsers/v2ray-dat.js';
import { textToMrs } from '../parsers/mihomo-mrs.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { categories, format, type, outputName } = req.body;

    if (!categories || !format || !type) {
      return res.status(400).json({ error: 'categories, format, and type required' });
    }

    let buffer;
    let filename;
    let contentType;

    if (format === 'v2ray') {
      if (type === 'geosite') {
        buffer = await buildGeosite(categories);
        filename = outputName ? `${outputName}.dat` : 'geosite.dat';
      } else {
        buffer = await buildGeoip(categories);
        filename = outputName ? `${outputName}.dat` : 'geoip.dat';
      }
      contentType = 'application/octet-stream';
    } else if (format === 'mrs') {
      const cat = categories[0];
      let text;
      const mrsBehavior = (type === 'geosite' || type === 'domain') ? 'domain' : 'ipcidr';
      if (type === 'geosite' || type === 'domain') {
        text = (cat.domains || []).map(d => d.value).join('\n');
      } else {
        text = (cat.cidrs || []).join('\n');
      }
      buffer = await textToMrs(text, mrsBehavior);
      filename = `${outputName || cat.tag || 'output'}.mrs`;
      contentType = 'application/octet-stream';
    } else if (format === 'text') {
      const cat = categories[0];
      let text;
      if (type === 'geosite' || type === 'domain') {
        text = (cat.domains || []).map(d => d.value).join('\n');
      } else {
        text = (cat.cidrs || []).join('\n');
      }
      buffer = Buffer.from(text + '\n', 'utf-8');
      filename = `${outputName || cat.tag || 'output'}.txt`;
      contentType = 'text/plain';
    } else {
      return res.status(400).json({ error: `Unsupported format: ${format}` });
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
