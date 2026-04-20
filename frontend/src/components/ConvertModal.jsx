import { useState } from 'react';
import { downloadFile } from '../api/client.js';
import { useI18n } from '../i18n.jsx';

export default function ConvertModal({ data, onClose, showToast }) {
  const { t } = useI18n();
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
      showToast(`${t('convertedTo')} ${filename}`);
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
        <h3>{t('convertDownload')}</h3>

        <div className="form-group">
          <label>{t('source')}</label>
          <input type="text" readOnly value={`${data.format.toUpperCase()} · ${data.type} · ${data.categories.length} ${t('categories')}`} />
        </div>

        <div className="form-group">
          <label>{t('targetFormat')}</label>
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
            <option value="text">Text (.txt)</option>
            <option value="mrs">Mihomo MRS (.mrs)</option>
            <option value="v2ray">V2Ray ({data.type === 'geosite' || data.type === 'domain' ? 'geosite' : 'geoip'}.dat)</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={handleConvert} disabled={loading}>
            {loading ? t('converting') : t('convertBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
