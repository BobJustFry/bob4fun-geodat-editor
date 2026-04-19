import { Router } from 'express';
import { buildGeosite, buildGeoip } from '../parsers/v2ray-dat.js';
import { textToMrs } from '../parsers/mihomo-mrs.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { categories, sourceFormat, targetFormat, type } = req.body;

    if (!categories || !targetFormat || !type) {
      return res.status(400).json({ error: 'categories, targetFormat, and type required' });
    }

    let buffer;
    let filename;

    if (targetFormat === 'v2ray') {
      if (type === 'geosite') {
        buffer = await buildGeosite(categories);
        filename = 'geosite.dat';
      } else {
        buffer = await buildGeoip(categories);
        filename = 'geoip.dat';
      }
    } else if (targetFormat === 'mrs') {
      // MRS supports single category only
      const cat = categories[0];
      let text;
      if (type === 'domain') {
        text = (cat.domains || []).map(d => d.value).join('\n');
      } else {
        text = (cat.cidrs || []).join('\n');
      }
      buffer = await textToMrs(text, type);
      filename = `${cat.tag || 'output'}.mrs`;
    } else if (targetFormat === 'text') {
      const cat = categories[0];
      let text;
      if (type === 'domain') {
        text = (cat.domains || []).map(d => d.value).join('\n');
      } else {
        text = (cat.cidrs || []).join('\n');
      }
      buffer = Buffer.from(text, 'utf-8');
      filename = `${cat.tag || 'output'}.txt`;
    } else {
      return res.status(400).json({ error: `Unsupported target format: ${targetFormat}` });
    }

    res.json({
      data: buffer.toString('base64'),
      filename,
      size: buffer.length
    });
  } catch (err) {
    console.error('Convert error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
