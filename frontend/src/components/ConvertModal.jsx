import { useState } from 'react';
import { downloadFile } from '../api/client.js';

export default function ConvertModal({ data, onClose, showToast }) {
  const [targetFormat, setTargetFormat] = useState('text');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const { blob, filename } = await downloadFile(
        data.categories,
        targetFormat,
        data.type
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Converted to ${filename}`);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Convert & Download</h3>

        <div className="form-group">
          <label>Source</label>
          <input type="text" readOnly value={`${data.format.toUpperCase()} · ${data.type} · ${data.categories.length} categories`} />
        </div>

        <div className="form-group">
          <label>Target Format</label>
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
            <option value="text">Text (.txt)</option>
            <option value="mrs">Mihomo MRS (.mrs)</option>
            <option value="v2ray">V2Ray ({data.type === 'geosite' || data.type === 'domain' ? 'geosite' : 'geoip'}.dat)</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConvert} disabled={loading}>
            {loading ? 'Converting...' : 'Convert & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
