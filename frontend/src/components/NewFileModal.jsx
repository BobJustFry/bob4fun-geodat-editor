import { useState } from 'react';
import { useI18n } from '../i18n.jsx';

const FILE_TYPES = [
  { value: 'geosite', label: 'Geosite', desc: 'newFileGeositeDesc', icon: '🌐' },
  { value: 'geoip',   label: 'GeoIP',   desc: 'newFileGeoipDesc',   icon: '📡' },
];

const FORMATS = [
  { value: 'v2ray', label: 'V2Ray (.dat)' },
  { value: 'mrs',   label: 'Mihomo (.mrs)' },
  { value: 'text',  label: 'Text (.txt)' },
];

export default function NewFileModal({ onCreated, onClose }) {
  const { t } = useI18n();
  const [type, setType]     = useState('geosite');
  const [format, setFormat] = useState('v2ray');
  const [name, setName]     = useState('');

  const handleCreate = () => {
    const filename = (name.trim() || (type === 'geosite' ? 'geosite' : 'geoip'));
    onCreated({
      format,
      type,
      categories: [],
      sessionId: null,
      filename: filename,
      originalName: filename,
      isNew: true,
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('newFile')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{t('newFile')}</h2>
          <button className="btn-close" onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <div className="modal-body">
          {/* File name */}
          <label className="new-file-label">{t('newFileName')}</label>
          <input
            className="new-file-input"
            type="text"
            placeholder={type === 'geosite' ? 'geosite' : 'geoip'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />

          {/* Type selector */}
          <label className="new-file-label">{t('newFileType')}</label>
          <div className="new-file-type-grid">
            {FILE_TYPES.map(ft => (
              <button
                key={ft.value}
                className={`new-file-type-card${type === ft.value ? ' selected' : ''}`}
                onClick={() => setType(ft.value)}
              >
                <span className="new-file-type-icon">{ft.icon}</span>
                <span className="new-file-type-name">{ft.label}</span>
                <span className="new-file-type-desc">{t(ft.desc)}</span>
              </button>
            ))}
          </div>

          {/* Format selector */}
          <label className="new-file-label">{t('newFileFormat')}</label>
          <div className="new-file-format-row">
            {FORMATS.map(f => (
              <button
                key={f.value}
                className={`new-file-format-btn${format === f.value ? ' selected' : ''}`}
                onClick={() => setFormat(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={handleCreate}>{t('create')}</button>
        </div>
      </div>
    </div>
  );
}
