import { useState, useRef, useCallback } from 'react';
import { uploadFile, uploadFromUrl, parseFile } from '../api/client.js';

export default function FileUploader({ onLoaded, onError }) {
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef(null);

  const processUpload = useCallback(async (uploadResult, displayName) => {
    const parseResult = await parseFile(uploadResult.sessionId, uploadResult.filename);
    onLoaded({
      ...parseResult,
      sessionId: uploadResult.sessionId,
      filename: uploadResult.filename,
      originalName: displayName
    });
  }, [onLoaded]);

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
        Loading file...
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={onDrop}
      >
        <div className="icon">📁</div>
        <p>
          Drop a file here or click to browse<br/>
          <small>Supports: .dat (V2Ray), .mrs (Mihomo), .txt, .yaml</small>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".dat,.mrs,.txt,.yaml,.yml,.db"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      <div className="url-input-row">
        <input
          type="text"
          placeholder="Or paste a URL to a file..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
        />
        <button className="btn btn-sm" onClick={handleUrl} disabled={!urlInput.trim()}>
          ↓ Fetch
        </button>
      </div>
    </div>
  );
}
