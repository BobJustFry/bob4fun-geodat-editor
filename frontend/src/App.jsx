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
        <div className="header-actions">
          {editorData && (
            <button className="btn" onClick={() => setShowConvert(true)}>
              {t('convert')}
            </button>
          )}
          <button className="btn" onClick={() => setShowAbout(true)}>
            {t('about')}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLanguage(lang === 'en' ? 'ru' : 'en')}
            title={lang === 'en' ? 'Русский' : 'English'}
          >
            {lang === 'en' ? 'RU' : 'EN'}
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t2 => t2 === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('lightTheme') : t('darkTheme')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="split-container">
        {!editorData ? (
          <div className="panel">
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
          </div>
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
          <div className="panel">
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
          </div>
        )}
      </div>

      <div className="status-bar">
        <span>Geodat Editor v1.8.1</span>
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
      </div>

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
