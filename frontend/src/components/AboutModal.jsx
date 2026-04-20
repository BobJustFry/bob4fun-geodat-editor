import { useState } from 'react';
import { useI18n } from '../i18n.jsx';

export default function AboutModal({ onClose }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const wallet = '0x132b5cd3db0469537291fd398afaa50a96962f66';

  const copyWallet = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close" onClick={onClose} style={{ position: 'absolute', top: '0.8rem', right: '0.8rem' }}>✕</button>

        <div className="about-logo">
          <img src="/android-chrome-512x512.png" alt="Bob4Fun" />
        </div>

        <h2 className="about-title">{t('aboutTitle')}</h2>
        <span className="about-version">v1.8.3</span>

        <p className="about-desc">
          {t('aboutDesc')}<br/>
          {t('aboutDesc2')}
        </p>

        <div className="about-features">
          <div className="about-feature">{t('featureEdit')}</div>
          <div className="about-feature">{t('featureLoad')}</div>
          <div className="about-feature">{t('featureSplit')}</div>
          <div className="about-feature">{t('featureExport')}</div>
        </div>

        <div className="about-links">
          <a
            href="https://github.com/BobJustFry/bob4fun-geodat-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="about-github"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>

        <div className="about-donate">
          <div className="about-donate-label">{t('donate')} · USDT (BEP20)</div>
          <div className="about-wallet" onClick={copyWallet} title={t('clickToCopy')}>
            <code>{wallet}</code>
            <span className="about-wallet-icon">{copied ? '✓' : '📋'}</span>
          </div>
          {copied && <div className="about-copied">{t('walletCopied')}</div>}
        </div>

        <div className="about-footer">
          {t('madeBy')} <strong>Bob4Fun</strong> · 2025
        </div>
      </div>
    </div>
  );
}
