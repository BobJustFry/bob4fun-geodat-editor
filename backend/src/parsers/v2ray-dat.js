import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, '..', 'proto', 'geodata.proto');

let root = null;

async function getRoot() {
  if (!root) {
    root = await protobuf.load(PROTO_PATH);
  }
  return root;
}

export async function parseGeosite(buffer) {
  const r = await getRoot();
  const GeoSiteList = r.lookupType('v2ray.core.app.router.routercommon.GeoSiteList');
  const decoded = GeoSiteList.decode(buffer);
  const obj = GeoSiteList.toObject(decoded, { enums: String });

  return (obj.entry || []).map(site => ({
    tag: site.countryCode,
    domains: (site.domain || []).map(d => ({
      type: d.type || 'Plain',
      value: d.value,
      attrs: (d.attribute || []).map(a => ({
        key: a.key,
        value: a.boolValue !== undefined ? a.boolValue : a.intValue
      }))
    }))
  }));
}

export async function buildGeosite(categories) {
  const r = await getRoot();
  const GeoSiteList = r.lookupType('v2ray.core.app.router.routercommon.GeoSiteList');
  const Domain = r.lookupType('v2ray.core.app.router.routercommon.Domain');
  const DomainType = r.lookupEnum('v2ray.core.app.router.routercommon.Domain.Type');

  const entry = categories.map(cat => ({
    countryCode: cat.tag,
    domain: (cat.domains || []).map(d => {
      const typeValue = DomainType.values[d.type] !== undefined
        ? DomainType.values[d.type]
        : 0;
      return {
        type: typeValue,
        value: d.value,
        attribute: (d.attrs || []).map(a => ({
          key: a.key,
          ...(typeof a.value === 'boolean' ? { boolValue: a.value } : { intValue: a.value })
        }))
      };
    })
  }));

  const msg = GeoSiteList.create({ entry });
  const err = GeoSiteList.verify(msg);
  if (err) throw new Error(err);
  return Buffer.from(GeoSiteList.encode(msg).finish());
}

export async function parseGeoip(buffer) {
  const r = await getRoot();
  const GeoIPList = r.lookupType('v2ray.core.app.router.routercommon.GeoIPList');
  const decoded = GeoIPList.decode(buffer);
  const obj = GeoIPList.toObject(decoded, { bytes: Buffer });

  return (obj.entry || []).map(geoip => ({
    tag: geoip.countryCode,
    cidrs: (geoip.cidr || []).map(c => {
      const ipBuf = Buffer.from(c.ip);
      let ipStr;
      if (ipBuf.length === 4) {
        ipStr = Array.from(ipBuf).join('.');
      } else if (ipBuf.length === 16) {
        const parts = [];
        for (let i = 0; i < 16; i += 2) {
          parts.push(ipBuf.readUInt16BE(i).toString(16));
        }
        ipStr = parts.join(':');
      } else {
        ipStr = ipBuf.toString('hex');
      }
      return `${ipStr}/${c.prefix}`;
    }),
    inverseMatch: geoip.inverseMatch || false
  }));
}

export async function buildGeoip(categories) {
  const r = await getRoot();
  const GeoIPList = r.lookupType('v2ray.core.app.router.routercommon.GeoIPList');

  const entry = categories.map(cat => ({
    countryCode: cat.tag,
    cidr: (cat.cidrs || []).map(cidrStr => {
      const [ipStr, prefixStr] = cidrStr.split('/');
      const prefix = parseInt(prefixStr, 10);
      let ip;
      if (ipStr.includes(':')) {
        // IPv6
        ip = ipv6ToBuffer(ipStr);
      } else {
        // IPv4
        ip = Buffer.from(ipStr.split('.').map(Number));
      }
      return { ip, prefix };
    }),
    inverseMatch: cat.inverseMatch || false
  }));

  const msg = GeoIPList.create({ entry });
  const err = GeoIPList.verify(msg);
  if (err) throw new Error(err);
  return Buffer.from(GeoIPList.encode(msg).finish());
}

function ipv6ToBuffer(ipStr) {
  const expanded = expandIPv6(ipStr);
  const parts = expanded.split(':');
  const buf = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    const val = parseInt(parts[i], 16);
    buf.writeUInt16BE(val, i * 2);
  }
  return buf;
}

function expandIPv6(ip) {
  if (ip.includes('::')) {
    const [left, right] = ip.split('::');
    const leftParts = left ? left.split(':') : [];
    const rightParts = right ? right.split(':') : [];
    const missing = 8 - leftParts.length - rightParts.length;
    const middle = Array(missing).fill('0');
    return [...leftParts, ...middle, ...rightParts].map(p => p.padStart(4, '0')).join(':');
  }
  return ip.split(':').map(p => p.padStart(4, '0')).join(':');
}
