import { useState, useMemo } from 'react';
import CategoryList from './CategoryList.jsx';

export default function DonorPanel({ data, selectedCat, onSelectCat, onCopyRules, type }) {
  const [filter, setFilter] = useState('');
  const [selectedRules, setSelectedRules] = useState(new Set());

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
        <span className="label">Donor</span>
        <span className="filename">{data.originalName}</span>
        <span className="format-badge">{data.format}</span>
        {selectedRules.size > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <span className="selection-count">{selectedRules.size} selected</span>
            <button className="btn btn-sm btn-success" onClick={handleCopy}>
              → Copy to Editor
            </button>
            <button className="btn btn-sm" onClick={() => setSelectedRules(new Set())}>
              Clear
            </button>
          </div>
        )}
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
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button className="btn btn-sm" onClick={selectAll}>Select All</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredRules.length}/{rules.length}
            </span>
          </div>
          <div className="rule-list">
            {filteredRules.map((rule, i) => {
              const value = isDomain ? rule.value : rule;
              const ruleType = isDomain ? rule.type : null;
              const isSelected = selectedRules.has(i);

              return (
                <div
                  key={`${value}-${i}`}
                  className={`rule-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleRule(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRule(i)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {ruleType && <span className="rule-type">{ruleType}</span>}
                  <span className="rule-value" title={value}>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
