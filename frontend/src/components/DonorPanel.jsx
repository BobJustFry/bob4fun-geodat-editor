import { useState, useMemo } from 'react';
import CategoryList from './CategoryList.jsx';
import Pagination from './Pagination.jsx';
import { useI18n } from '../i18n.jsx';

export default function DonorPanel({ data, selectedCat, onSelectCat, onCopyRules, type, onClose }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState('');
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const isDomain = type === 'geosite' || type === 'domain';
  const category = data.categories[selectedCat] || null;
  const rules = isDomain ? (category?.domains || []) : (category?.cidrs || []);

  const filteredRules = useMemo(() => {
    if (!filter) return rules;
    const lower = filter.toLowerCase();
    if (isDomain) {
      return rules.filter(r => r.value.toLowerCase().includes(lower));
    }
    return rules.filter(r => r.toLowerCase().includes(lower));
  }, [rules, filter, isDomain]);

  const paginatedRules = useMemo(() => {
    if (pageSize === Infinity) return filteredRules;
    return filteredRules.slice(0, page * pageSize);
  }, [filteredRules, page, pageSize]);

  const pageOffset = 0;

  const toggleRule = (index) => {
    const next = new Set(selectedRules);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedRules(next);
  };

  const selectAll = () => {
    const all = new Set(filteredRules.map((_, i) => i));
    setSelectedRules(all);
  };

  const handleCopy = () => {
    const selected = filteredRules.filter((_, i) => selectedRules.has(i));
    onCopyRules(selected);
    setSelectedRules(new Set());
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="label">{t('donor')}</span>
        <span className="filename">{data.originalName}</span>
        <span className="format-badge">{data.format}</span>
        {selectedRules.size > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <span className="selection-count">{selectedRules.size} {t('selected')}</span>
            <button className="btn btn-sm btn-success" onClick={handleCopy}>
              {t('copyToEditor')}
            </button>
            <button className="btn btn-sm" onClick={() => setSelectedRules(new Set())}>
              {t('clear')}
            </button>
          </div>
        )}
        <button className="btn-close" onClick={onClose} title={t('closeDonor')} style={{ marginLeft: selectedRules.size > 0 ? '0.3rem' : 'auto' }}>✕</button>
      </div>
      <div className="panel-body" style={{ flexDirection: 'row' }}>
        <CategoryList
          categories={data.categories}
          selected={selectedCat}
          onSelect={(i) => { onSelectCat(i); setSelectedRules(new Set()); setFilter(''); }}
          onAdd={() => {}}
          onRemove={() => {}}
        />
        <div className="rule-list-container">
          <div className="rule-toolbar">
            <input
              type="text"
              placeholder={t('filter')}
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            />
            <button className="btn btn-sm" onClick={selectAll}>{t('selectAll')}</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredRules.length}/{rules.length}
            </span>
          </div>
          <div className="rule-list">
            {paginatedRules.map((rule, i) => {
              const globalIndex = pageOffset + i;
              const value = isDomain ? rule.value : rule;
              const ruleType = isDomain ? rule.type : null;
              const isSelected = selectedRules.has(globalIndex);

              return (
                <div
                  key={`${value}-${i}`}
                  className={`rule-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleRule(globalIndex)}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRule(globalIndex)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {ruleType && <span className="rule-type">{ruleType}</span>}
                  <span className="rule-value" title={value}>{value}</span>
                </div>
              );
            })}
          </div>

          <Pagination
            total={filteredRules.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            onLoadMore={() => setPage(p => p + 1)}
          />
        </div>
      </div>
    </div>
  );
}
