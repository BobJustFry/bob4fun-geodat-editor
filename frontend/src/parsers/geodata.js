import { GeoSiteList, GeoIPList } from './proto.js';

const DOMAIN_TYPE_MAP = { 0: 'Plain', 1: 'Regex', 2: 'RootDomain', 3: 'Full' };

function ipBytesToString(ip) {
  if (ip.length === 4) return ip.join('.');
  if (ip.length === 16) {
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push(((ip[i] << 8) | ip[i + 1]).toString(16));
    }
    return parts.join(':');
  }
  return Array.from(ip).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function parseGeosite(buffer) {
  const decoded = GeoSiteList.decode(new Uint8Array(buffer));
  return (decoded.entry || []).map(site => ({
    tag: site.country_code,
    count: (site.domain || []).length,
    domains: (site.domain || []).map(d => ({
      type: DOMAIN_TYPE_MAP[d.type] || 'Plain',
      value: d.value,
      attrs: (d.attribute || []).map(a => ({
        key: a.key,
        value: a.bool_value !== undefined ? a.bool_value : a.int_value
      }))
    }))
  }));
}

export function parseGeoip(buffer) {
  const decoded = GeoIPList.decode(new Uint8Array(buffer));
  return (decoded.entry || []).map(geoip => ({
    tag: geoip.country_code,
    count: (geoip.cidr || []).length,
    cidrs: (geoip.cidr || []).map(c => {
      const ip = c.ip instanceof Uint8Array ? c.ip : new Uint8Array(c.ip);
      return `${ipBytesToString(ip)}/${c.prefix}`;
    }),
    inverseMatch: geoip.inverse_match || false
  }));
}

export function detectType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('geosite')) return 'geosite';
  if (lower.includes('geoip')) return 'geoip';
  return null; // unknown, try geosite first
}
