import { useState, useRef, useCallback } from 'react';
import { uploadFile, parseFile } from '../api/client.js';

export default function FileUploader({ onLoaded, onError }) {
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const uploadResult = await uploadFile(file);
      const parseResult = await parseFile(uploadResult.sessionId, uploadResult.filename);
      onLoaded({
        ...parseResult,
        sessionId: uploadResult.sessionId,
        filename: uploadResult.filename,
        originalName: file.name
      });
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onLoaded, onError]);

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
        Parsing file...
      </div>
    );
  }

  return (
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
  );
}
