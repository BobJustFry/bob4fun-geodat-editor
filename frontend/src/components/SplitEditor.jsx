import { useState, useMemo } from 'react';
import CategoryList from './CategoryList.jsx';
import RuleEditor from './RuleEditor.jsx';
import DonorPanel from './DonorPanel.jsx';
import { downloadFile } from '../api/client.js';

export default function SplitEditor({ editorData, setEditorData, donorData, showToast, onCloseEditor, onCloseDonor }) {
  const [selectedCat, setSelectedCat] = useState(0);
  const [donorSelectedCat, setDonorSelectedCat] = useState(0);

  const currentCategory = editorData.categories[selectedCat] || null;

  const handleAddRule = (rule) => {
    const updated = { ...editorData };
    const cat = { ...updated.categories[selectedCat] };

    if (editorData.type === 'geosite' || editorData.type === 'domain') {
      cat.domains = [...(cat.domains || []), rule];
      cat.count = cat.domains.length;
    } else {
      cat.cidrs = [...(cat.cidrs || []), rule];
      cat.count = cat.cidrs.length;
    }

    updated.categories = [...updated.categories];
    updated.categories[selectedCat] = cat;
    setEditorData(updated);
  };

  const handleRemoveRule = (index) => {
    const updated = { ...editorData };
    const cat = { ...updated.categories[selectedCat] };

    if (editorData.type === 'geosite' || editorData.type === 'domain') {
      cat.domains = cat.domains.filter((_, i) => i !== index);
      cat.count = cat.domains.length;
    } else {
      cat.cidrs = cat.cidrs.filter((_, i) => i !== index);
      cat.count = cat.cidrs.length;
    }

    updated.categories = [...updated.categories];
    updated.categories[selectedCat] = cat;
    setEditorData(updated);
  };

  const handleEditRule = (index, newRule) => {
    const updated = { ...editorData };
    const cat = { ...updated.categories[selectedCat] };

    if (editorData.type === 'geosite' || editorData.type === 'domain') {
      cat.domains = [...cat.domains];
      cat.domains[index] = newRule;
    } else {
      cat.cidrs = [...cat.cidrs];
      cat.cidrs[index] = newRule;
    }

    updated.categories = [...updated.categories];
    updated.categories[selectedCat] = cat;
    setEditorData(updated);
  };

  const handleCopyFromDonor = (rules) => {
    const updated = { ...editorData };
    const cat = { ...updated.categories[selectedCat] };

    if (editorData.type === 'geosite' || editorData.type === 'domain') {
      const existing = new Set((cat.domains || []).map(d => d.value));
      const newRules = rules.filter(r => !existing.has(r.value));
      cat.domains = [...(cat.domains || []), ...newRules];
      cat.count = cat.domains.length;
      showToast(`Copied ${newRules.length} domains`);
    } else {
      const existing = new Set(cat.cidrs || []);
      const newRules = rules.filter(r => !existing.has(r));
      cat.cidrs = [...(cat.cidrs || []), ...newRules];
      cat.count = cat.cidrs.length;
      showToast(`Copied ${newRules.length} CIDRs`);
    }

    updated.categories = [...updated.categories];
    updated.categories[selectedCat] = cat;
    setEditorData(updated);
  };

  const handleAddCategory = (tag) => {
    const updated = { ...editorData };
    const newCat = {
      tag,
      count: 0,
      ...(editorData.type === 'geosite' || editorData.type === 'domain'
        ? { domains: [] }
        : { cidrs: [] })
    };
    updated.categories = [...updated.categories, newCat];
    setEditorData(updated);
    setSelectedCat(updated.categories.length - 1);
  };

  const handleRemoveCategory = (index) => {
    const updated = { ...editorData };
    updated.categories = updated.categories.filter((_, i) => i !== index);
    setEditorData(updated);
    if (selectedCat >= updated.categories.length) {
      setSelectedCat(Math.max(0, updated.categories.length - 1));
    }
  };

  const handleDownload = async (format) => {
    try {
      const { blob, filename } = await downloadFile(
        editorData.categories,
        format,
        editorData.type
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="label">Editor</span>
          <span className="filename">{editorData.originalName}</span>
          <span className="format-badge">{editorData.format}</span>
          <span className="format-badge">{editorData.type}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button className="btn btn-sm btn-success" onClick={() => handleDownload(editorData.format)}>
              ↓ Save
            </button>
            {editorData.format !== 'text' && (
              <button className="btn btn-sm" onClick={() => handleDownload('text')}>
                ↓ .txt
              </button>
            )}
            {editorData.format !== 'mrs' && (
              <button className="btn btn-sm" onClick={() => handleDownload('mrs')}>
                ↓ .mrs
              </button>
            )}
            {editorData.format !== 'v2ray' && (
              <button className="btn btn-sm" onClick={() => handleDownload('v2ray')}>
                ↓ .dat
              </button>
            )}
            <button className="btn-close" onClick={onCloseEditor} title="Close Editor">✕</button>
          </div>
        </div>
        <div className="panel-body" style={{ flexDirection: 'row' }}>
          <CategoryList
            categories={editorData.categories}
            selected={selectedCat}
            onSelect={setSelectedCat}
            onAdd={handleAddCategory}
            onRemove={handleRemoveCategory}
          />
          <RuleEditor
            category={currentCategory}
            type={editorData.type}
            onAdd={handleAddRule}
            onRemove={handleRemoveRule}
            onEdit={handleEditRule}
          />
        </div>
      </div>

      {donorData && (
        <DonorPanel
          data={donorData}
          selectedCat={donorSelectedCat}
          onSelectCat={setDonorSelectedCat}
          onCopyRules={handleCopyFromDonor}
          type={editorData.type}
          onClose={onCloseDonor}
        />
      )}
    </>
  );
}
