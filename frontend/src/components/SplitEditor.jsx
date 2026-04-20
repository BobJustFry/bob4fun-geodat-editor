import { useState, useMemo, useCallback, useEffect } from 'react';
import CategoryList from './CategoryList.jsx';
import RuleEditor from './RuleEditor.jsx';
import DonorPanel from './DonorPanel.jsx';
import { downloadFile, fetchCategoryRules } from '../api/client.js';
import { useI18n } from '../i18n.jsx';
import useResizable from './useResizable.js';

export default function SplitEditor({ editorData, setEditorData, donorData, setDonorData, showToast, onCloseEditor, onCloseDonor }) {
  const { t } = useI18n();
  const [selectedCat, setSelectedCat] = useState(0);
  const [donorSelectedCat, setDonorSelectedCat] = useState(0);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingDonorRules, setLoadingDonorRules] = useState(false);
  const editorResize = useResizable({ storageKey: 'editor-cat-width' });

  const currentCategory = editorData.categories[selectedCat] || null;
  const isDomain = editorData.type === 'geosite' || editorData.type === 'domain';

  // Check if a category has its rules loaded
  const hasRulesLoaded = (cat) => {
    if (!cat) return false;
    return cat.domains !== undefined || cat.cidrs !== undefined;
  };

  // Load rules for editor category
  const loadEditorRules = useCallback(async (index) => {
    const cat = editorData.categories[index];
    if (!cat || hasRulesLoaded(cat)) return;
    setLoadingRules(true);
    try {
      const rules = await fetchCategoryRules(editorData.sessionId, editorData.filename, index);
      const updated = { ...editorData };
      updated.categories = [...updated.categories];
      updated.categories[index] = { ...updated.categories[index], ...rules };
      setEditorData(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingRules(false);
    }
  }, [editorData, setEditorData, showToast]);

  // Load rules for donor category
  const loadDonorRules = useCallback(async (index) => {
    if (!donorData) return;
    const cat = donorData.categories[index];
    if (!cat || hasRulesLoaded(cat)) return;
    setLoadingDonorRules(true);
    try {
      const rules = await fetchCategoryRules(donorData.sessionId, donorData.filename, index);
      const updated = { ...donorData };
      updated.categories = [...updated.categories];
      updated.categories[index] = { ...updated.categories[index], ...rules };
      setDonorData(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingDonorRules(false);
    }
  }, [donorData, setDonorData, showToast]);

  // Auto-load rules when selected category changes
  useEffect(() => {
    loadEditorRules(selectedCat);
  }, [selectedCat, loadEditorRules]);

  useEffect(() => {
    if (donorData) loadDonorRules(donorSelectedCat);
  }, [donorSelectedCat, donorData, loadDonorRules]);

  // Load ALL categories rules (for v2ray download)
  const loadAllEditorRules = useCallback(async () => {
    const missing = editorData.categories
      .map((cat, i) => hasRulesLoaded(cat) ? null : i)
      .filter(i => i !== null);
    if (missing.length === 0) return;
    setLoadingRules(true);
    try {
      const updated = { ...editorData, categories: [...editorData.categories] };
      for (const idx of missing) {
        const rules = await fetchCategoryRules(editorData.sessionId, editorData.filename, idx);
        updated.categories[idx] = { ...updated.categories[idx], ...rules };
      }
      setEditorData(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingRules(false);
    }
  }, [editorData, setEditorData, showToast]);

  const handleAddRule = (ruleOrRules) => {
    const rules = Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
    const updated = { ...editorData };
    const cat = { ...updated.categories[selectedCat] };

    if (editorData.type === 'geosite' || editorData.type === 'domain') {
      cat.domains = [...(cat.domains || []), ...rules];
      cat.count = cat.domains.length;
    } else {
      cat.cidrs = [...(cat.cidrs || []), ...rules];
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
      showToast(`${t('copied')} ${newRules.length} ${t('copiedDomains')}`);
    } else {
      const existing = new Set(cat.cidrs || []);
      const newRules = rules.filter(r => !existing.has(r));
      cat.cidrs = [...(cat.cidrs || []), ...newRules];
      cat.count = cat.cidrs.length;
      showToast(`${t('copied')} ${newRules.length} ${t('copiedCidrs')}`);
    }

    updated.categories = [...updated.categories];
    updated.categories[selectedCat] = cat;
    setEditorData(updated);
  };

  const handleCopyCategoryFromDonor = (donorCategory) => {
    const updated = { ...editorData };
    const existingIndex = updated.categories.findIndex(c => c.tag === donorCategory.tag);

    if (existingIndex >= 0) {
      // Merge into existing category
      const cat = { ...updated.categories[existingIndex] };
      if (editorData.type === 'geosite' || editorData.type === 'domain') {
        const existing = new Set((cat.domains || []).map(d => d.value));
        const newRules = (donorCategory.domains || []).filter(r => !existing.has(r.value));
        cat.domains = [...(cat.domains || []), ...newRules];
        cat.count = cat.domains.length;
        showToast(`${t('copied')} ${newRules.length} ${t('copiedDomains')} → ${cat.tag}`);
      } else {
        const existing = new Set(cat.cidrs || []);
        const newRules = (donorCategory.cidrs || []).filter(r => !existing.has(r));
        cat.cidrs = [...(cat.cidrs || []), ...newRules];
        cat.count = cat.cidrs.length;
        showToast(`${t('copied')} ${newRules.length} ${t('copiedCidrs')} → ${cat.tag}`);
      }
      updated.categories = [...updated.categories];
      updated.categories[existingIndex] = cat;
      setEditorData(updated);
      setSelectedCat(existingIndex);
    } else {
      // Create new category
      const newCat = { ...donorCategory };
      updated.categories = [...updated.categories, newCat];
      setEditorData(updated);
      setSelectedCat(updated.categories.length - 1);
      showToast(`${t('copied')} ${donorCategory.tag}`);
    }
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

  const handleRenameCategory = (tag, index) => {
    const trimmed = tag.trim().toUpperCase();
    if (!trimmed) return;
    const updated = { ...editorData };
    updated.categories = [...updated.categories];
    updated.categories[index] = { ...updated.categories[index], tag: trimmed };
    setEditorData(updated);
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
      // For v2ray, need all categories loaded
      if (format === 'v2ray') {
        await loadAllEditorRules();
      }
      const cats = (format === 'mrs' || format === 'text')
        ? [editorData.categories[selectedCat]]
        : editorData.categories;
      const { blob, filename } = await downloadFile(
        cats,
        format,
        editorData.type
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${t('downloaded')} ${filename}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="label">{t('editor')}</span>
          <span className="filename">{editorData.originalName}</span>
          <span className="format-badge">{editorData.format}</span>
          <span className="format-badge">{editorData.type}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button className="btn btn-sm btn-success" onClick={() => handleDownload(editorData.format)}>
              {t('save')}
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
            <button className="btn-close" onClick={onCloseEditor} title={t('closeEditor')}>✕</button>
          </div>
        </div>
        <div className="panel-body" style={{ flexDirection: 'row' }} ref={editorResize.containerRef}>
          <CategoryList
            categories={editorData.categories}
            selected={selectedCat}
            onSelect={setSelectedCat}
            onAdd={(tag, index) => {
              if (typeof index === 'number') {
                handleRenameCategory(tag, index);
                return;
              }
              handleAddCategory(tag);
            }}
            onRemove={handleRemoveCategory}
            width={editorResize.width}
          />
          <div className="resize-handle" onMouseDown={editorResize.onMouseDown} />
          <RuleEditor
            category={currentCategory}
            type={editorData.type}
            onAdd={handleAddRule}
            onRemove={handleRemoveRule}
            onEdit={handleEditRule}
            loading={loadingRules}
            showToast={showToast}
          />
        </div>
      </div>

      {donorData && (
        <DonorPanel
          data={donorData}
          selectedCat={donorSelectedCat}
          onSelectCat={setDonorSelectedCat}
          onCopyRules={handleCopyFromDonor}
          onCopyCategory={handleCopyCategoryFromDonor}
          type={editorData.type}
          onClose={onCloseDonor}
          loading={loadingDonorRules}
        />
      )}
    </>
  );
}
