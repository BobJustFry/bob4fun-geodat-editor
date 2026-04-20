import { useState, useCallback, useEffect } from 'react';
import FileUploader from './components/FileUploader.jsx';
import SplitEditor from './components/SplitEditor.jsx';
import ConvertModal from './components/ConvertModal.jsx';
import AboutModal from './components/AboutModal.jsx';
import Toast from './components/Toast.jsx';
import { useI18n } from './i18n.jsx';

export default function App() {
  const { t, lang, setLanguage } = useI18n();
  const [editorData, setEditorData] = useState(null);
  const [donorData, setDonorData] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConvert, setShowConvert] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // SEO: Update meta tags based on language
  useEffect(() => {
    const metaDescEn = "Free online Geodat editor for .dat, .mrs, .txt, .yaml files. Edit geosite and geoip data, convert formats, manage routing rules for V2Ray, Mihomo, Clash. Fast client-side parsing, no server processing.";
    const metaDescRu = "Бесплатный онлайн редактор Geodat для файлов .dat, .mrs, .txt, .yaml. Редактируйте гео-данные, конвертируйте форматы, управляйте правилами маршрутизации для V2Ray, Mihomo, Clash. Быстрая обработка на клиенте.";
    
    const titleEn = "Geodat Editor - Edit Geosite & GeoIP Data Files Online | V2Ray, Mihomo";
    const titleRu = "Geodat Editor - Редактор файлов Geosite и GeoIP онлайн | V2Ray, Mihomo";
    
    const keywordsEn = "geodat editor, geosite editor, geoip editor, V2Ray, Mihomo, Clash, .dat file editor, routing rules, geolocation data, IP address editor, domain rules";
    const keywordsRu = "редактор geodat, редактор geosite, редактор geoip, V2Ray, Mihomo, Clash, редактор файлов dat, правила маршрутизации, геоданные, редактор IP адресов";
    
    // Update title
    document.title = lang === 'en' ? titleEn : titleRu;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', lang === 'en' ? metaDescEn : metaDescRu);
    
    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', lang === 'en' ? keywordsEn : keywordsRu);
    
    // Update og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', lang === 'en' ? titleEn : titleRu);
    
    // Update og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', lang === 'en' ? metaDescEn : metaDescRu);
    
    // Update twitter title
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', lang === 'en' ? titleEn : titleRu);
    
    // Update twitter description
    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', lang === 'en' ? metaDescEn : metaDescRu);
    
    // Update lang attribute
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleEditorUpdate = useCallback((data) => {
    setEditorData(data);
    setEditorDirty(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    if (editorDirty) {
      if (!window.confirm(t('unsavedChanges'))) return;
    }
    setEditorData(null);
    setEditorDirty(false);
  }, [editorDirty, t]);

  const handleCloseDonor = useCallback(() => {
    setDonorData(null);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>◆ Geodat Editor</h1>
        <nav className="header-actions" aria-label={t('navigation')}>
          {editorData && (
            <button className="btn" onClick={() => setShowConvert(true)} aria-label={t('convert')}>
              {t('convert')}
            </button>
          )}
          <button
            className="lang-toggle"
            onClick={() => setLanguage(lang === 'en' ? 'ru' : 'en')}
            title={lang === 'en' ? 'Русский' : 'English'}
            aria-label="Toggle language"
            aria-pressed={lang === 'ru'}
          >
            {lang === 'en' ? 'RU' : 'EN'}
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t2 => t2 === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('lightTheme') : t('darkTheme')}
            aria-label="Toggle theme"
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setShowAbout(true)} 
            title={t('about')} 
            aria-label={t('about')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
        </nav>
      </header>

      <main className="split-container" role="main">
        {!editorData ? (
          <section className="panel" aria-label={t('editor')}>
            <div className="panel-header">
              <span className="label">{t('editor')}</span>
            </div>
            <FileUploader
              onLoaded={(data) => {
                setEditorData(data);
                setEditorDirty(false);
                showToast(`${t('loaded')}: ${data.categories.length} ${t('categories')}`);
              }}
              onError={(msg) => showToast(msg, 'error')}
            />
          </section>
        ) : (
          <SplitEditor
            editorData={editorData}
            setEditorData={handleEditorUpdate}
            donorData={donorData}
            setDonorData={setDonorData}
            showToast={showToast}
            onCloseEditor={handleCloseEditor}
            onCloseDonor={handleCloseDonor}
          />
        )}

        {!donorData && editorData && (
          <section className="panel" aria-label={t('donor')}>
            <div className="panel-header">
              <span className="label">{t('donor')}</span>
              <span className="filename">{t('donorHint')}</span>
            </div>
            <FileUploader
              onLoaded={(data) => {
                setDonorData(data);
                showToast(`${t('donorLoaded')}: ${data.categories.length} ${t('categories')}`);
              }}
              onError={(msg) => showToast(msg, 'error')}
            />
          </section>
        )}
      </main>

      <footer className="status-bar" role="contentinfo">
        <span>Geodat Editor v1.9.0</span>
        {editorData && (
          <span>
            {editorData.format.toUpperCase()} · {editorData.type} · {editorData.categories.length} {t('categories')}
          </span>
        )}
        {donorData && (
          <span>
            {t('donor')}: {donorData.format.toUpperCase()} · {donorData.categories.length} {t('categories')}
          </span>
        )}
      </footer>

      {showConvert && editorData && (
        <ConvertModal
          data={editorData}
          onClose={() => setShowConvert(false)}
          showToast={showToast}
        />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
