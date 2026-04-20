import { useState, useCallback } from 'react';
import FileUploader from './components/FileUploader.jsx';
import SplitEditor from './components/SplitEditor.jsx';
import ConvertModal from './components/ConvertModal.jsx';
import AboutModal from './components/AboutModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [editorData, setEditorData] = useState(null);
  const [donorData, setDonorData] = useState(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConvert, setShowConvert] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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
      if (!window.confirm('Editor has unsaved changes. Close anyway?')) return;
    }
    setEditorData(null);
    setEditorDirty(false);
  }, [editorDirty]);

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
              ⇄ Convert
            </button>
          )}
          <button className="btn" onClick={() => setShowAbout(true)}>
            ℹ About
          </button>
        </div>
      </header>

      <div className="split-container">
        {!editorData ? (
          <div className="panel">
            <div className="panel-header">
              <span className="label">Editor</span>
            </div>
            <FileUploader
              onLoaded={(data) => {
                setEditorData(data);
                setEditorDirty(false);
                showToast(`Loaded: ${data.categories.length} categories`);
              }}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>
        ) : (
          <SplitEditor
            editorData={editorData}
            setEditorData={handleEditorUpdate}
            donorData={donorData}
            showToast={showToast}
            onCloseEditor={handleCloseEditor}
            onCloseDonor={handleCloseDonor}
          />
        )}

        {!donorData && editorData && (
          <div className="panel">
            <div className="panel-header">
              <span className="label">Donor</span>
              <span className="filename">— drag a file to use as source</span>
            </div>
            <FileUploader
              onLoaded={(data) => {
                setDonorData(data);
                showToast(`Donor loaded: ${data.categories.length} categories`);
              }}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>
        )}
      </div>

      <div className="status-bar">
        <span>Geodat Editor v1.4.0</span>
        {editorData && (
          <span>
            {editorData.format.toUpperCase()} · {editorData.type} · {editorData.categories.length} categories
          </span>
        )}
        {donorData && (
          <span>
            Donor: {donorData.format.toUpperCase()} · {donorData.categories.length} categories
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
