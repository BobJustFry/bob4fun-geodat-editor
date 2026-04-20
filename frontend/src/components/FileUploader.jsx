import { useState, useRef, useCallback } from 'react';
import { uploadFile, uploadFromUrl, parseFile, fetchRawFile } from '../api/client.js';
import { parseGeosite, parseGeoip, detectType } from '../parsers/geodata.js';
import { useI18n } from '../i18n.jsx';

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
    setLoading(true);
    try {
      const uploadResult = await uploadFile(file);
      await processUpload(uploadResult, file.name);
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [processUpload, onError]);

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
