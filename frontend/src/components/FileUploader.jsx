import { useState, useRef, useCallback } from 'react';
import { uploadFile, uploadFromUrl, parseFile, fetchRawFile } from '../api/client.js';
import { parseGeosite, parseGeoip, detectType } from '../parsers/geodata.js';
import { useI18n } from '../i18n.jsx';

// ──────────────────────────────────────────────
// Pre-upload content validators
// ──────────────────────────────────────────────

const DOMAIN_RE = /^(?:(?:\*\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;
const CIDR_V4_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const CIDR_V6_RE = /^[0-9a-fA-F:]+(?:\/\d{1,3})?$/;
// zstd magic bytes: 0x28 0xB5 0x2F 0xFD
const ZSTD_MAGIC = [0x28, 0xB5, 0x2F, 0xFD];

function isValidDomain(s) {
  return DOMAIN_RE.test(s);
}
function isValidCidr(s) {
  if (CIDR_V4_RE.test(s)) {
    const parts = s.split('/')[0].split('.');
    return parts.every(p => parseInt(p, 10) <= 255);
  }
  return CIDR_V6_RE.test(s) && s.includes(':');
}

// Strip rule prefixes like "DOMAIN,", "IP-CIDR,", "DOMAIN-SUFFIX,", "+."
function stripPrefix(s) {
  return s.replace(/^(?:DOMAIN(?:-SUFFIX|-KEYWORD|-REGEX)?|IP-CIDR6?|SRC-IP-CIDR),/i, '')
          .replace(/^\+\./, '');
}

async function validateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'dat') {
    // Must be binary protobuf — check first byte is not printable ASCII text
    const header = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(header);
    const printableCount = bytes.filter(b => b >= 0x20 && b < 0x7F).length;
    if (printableCount > 12) {
      throw new Error('invalidFileDat');
    }
    return;
  }

  if (ext === 'mrs') {
    // Must start with zstd magic bytes
    const header = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(header);
    const valid = ZSTD_MAGIC.every((b, i) => bytes[i] === b);
    if (!valid) {
      throw new Error('invalidFileMrs');
    }
    return;
  }

  if (ext === 'txt' || ext === 'yaml' || ext === 'yml') {
    // Read first 8KB as text and sample lines
    const slice = await file.slice(0, 8192).text();
    const lines = slice.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('//') && l !== 'payload:' && l !== '---');

    if (lines.length === 0) {
      throw new Error('invalidFileEmpty');
    }

    // For YAML: must contain "payload:" key
    if ((ext === 'yaml' || ext === 'yml') && !slice.includes('payload:')) {
      throw new Error('invalidFileYaml');
    }

    // Sample up to 30 lines (strip "- " prefix for yaml lists)
    const sample = lines.slice(0, 30).map(l => {
      const s = l.replace(/^-\s+/, '');
      return stripPrefix(s);
    });

    const domainCount = sample.filter(isValidDomain).length;
    const cidrCount = sample.filter(isValidCidr).length;
    const ratio = Math.max(domainCount, cidrCount) / sample.length;

    if (ratio < 0.4) {
      throw new Error('invalidFileContent');
    }
    return;
  }
}

export default function FileUploader({ onLoaded, onError }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef(null);

  const parseDatClientSide = useCallback(async (buffer, filename) => {
    const guessedType = detectType(filename);

    if (guessedType === 'geoip') {
      const categories = parseGeoip(buffer);
      return { format: 'v2ray', type: 'geoip', categories };
    }
    if (guessedType === 'geosite') {
      const categories = parseGeosite(buffer);
      return { format: 'v2ray', type: 'geosite', categories };
    }
    // Unknown - try geosite first, fallback to geoip
    try {
      const categories = parseGeosite(buffer);
      if (categories.length > 0) return { format: 'v2ray', type: 'geosite', categories };
    } catch { /* ignore */ }
    const categories = parseGeoip(buffer);
    return { format: 'v2ray', type: 'geoip', categories };
  }, []);

  const processUpload = useCallback(async (uploadResult, displayName) => {
    const ext = displayName.split('.').pop().toLowerCase();

    if (ext === 'dat') {
      // Client-side parsing for .dat files — much faster
      const buffer = await fetchRawFile(uploadResult.sessionId, uploadResult.filename);
      const parseResult = await parseDatClientSide(buffer, displayName);
      onLoaded({
        ...parseResult,
        sessionId: uploadResult.sessionId,
        filename: uploadResult.filename,
        originalName: displayName
      });
    } else {
      // Server-side parsing for .mrs, .txt, .yaml etc
      const parseResult = await parseFile(uploadResult.sessionId, uploadResult.filename);
      onLoaded({
        ...parseResult,
        sessionId: uploadResult.sessionId,
        filename: uploadResult.filename,
        originalName: displayName
      });
    }
  }, [onLoaded, parseDatClientSide]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Warn if file is large (>30MB) — may cause browser slowness
    if (file.size > 30 * 1024 * 1024) {
      const ok = window.confirm(t('largeFileWarning'));
      if (!ok) return;
    }

    setLoading(true);
    try {
      // Validate file content before uploading
      try {
        await validateFile(file);
      } catch (validationErr) {
        const msgKey = validationErr.message;
        const msgMap = {
          invalidFileDat:     t('invalidFileDat'),
          invalidFileMrs:     t('invalidFileMrs'),
          invalidFileEmpty:   t('invalidFileEmpty'),
          invalidFileYaml:    t('invalidFileYaml'),
          invalidFileContent: t('invalidFileContent'),
        };
        throw new Error(msgMap[msgKey] || validationErr.message);
      }

      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'dat') {
        // Parse .dat directly in browser + upload in parallel
        const [buffer, uploadResult] = await Promise.all([
          file.arrayBuffer(),
          uploadFile(file)
        ]);
        const parseResult = await parseDatClientSide(buffer, file.name);
        onLoaded({
          ...parseResult,
          sessionId: uploadResult.sessionId,
          filename: uploadResult.filename,
          originalName: file.name
        });
      } else {
        const uploadResult = await uploadFile(file);
        await processUpload(uploadResult, file.name);
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [processUpload, parseDatClientSide, onError, onLoaded]);

  const handleUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoading(true);
    try {
      const uploadResult = await uploadFromUrl(url);
      await processUpload(uploadResult, uploadResult.originalName || uploadResult.filename);
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [urlInput, processUpload, onError]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        {t('loadingFile')}
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div className="url-input-row">
        <input
          type="text"
          placeholder={t('urlPlaceholder')}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
        />
        <button className="btn btn-sm" onClick={handleUrl} disabled={!urlInput.trim()}>
          {t('fetch')}
        </button>
      </div>
      <div
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={onDrop}
      >
        <div className="icon">📁</div>
        <p>
          {t('dropFile')}<br/>
          <small>{t('supports')}</small>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".dat,.mrs,.txt,.yaml,.yml,.db"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
