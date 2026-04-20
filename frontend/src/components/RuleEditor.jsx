import { useState, useMemo } from 'react';
import Pagination from './Pagination.jsx';

export default function RuleEditor({ category, type, onAdd, onRemove, onEdit }) {
  const [filter, setFilter] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('RootDomain');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState('');

  const isDomain = type === 'geosite' || type === 'domain';
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

  const handleAdd = () => {
    const val = newValue.trim();
    if (!val) return;

    if (isDomain) {
      // Support adding multiple values separated by newlines
      const values = val.split('\n').map(v => v.trim()).filter(Boolean);
      values.forEach(v => {
        onAdd({ type: newType, value: v, attrs: [] });
      });
    } else {
      const values = val.split('\n').map(v => v.trim()).filter(Boolean);
      values.forEach(v => onAdd(v));
    }
    setNewValue('');
  };

  if (!category) {
    return (
      <div className="rule-list-container">
        <div className="loading">Select a category</div>
      </div>
    );
  }

  return (
    <div className="rule-list-container">
      <div className="rule-toolbar">
        <input
          type="text"
          placeholder="Filter rules..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filteredRules.length}/{rules.length}
        </span>
      </div>

      <div className="add-rule-form">
        {isDomain && (
          <select value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="RootDomain">domain</option>
            <option value="Full">full</option>
            <option value="Plain">keyword</option>
            <option value="Regex">regex</option>
          </select>
        )}
        <input
          type="text"
          placeholder={isDomain ? 'Add domain (e.g. google.com)' : 'Add CIDR (e.g. 10.0.0.0/8)'}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-sm btn-success" onClick={handleAdd}>+ Add</button>
      </div>

      <div className="rule-list">
        {paginatedRules.map((rule, i) => {
          const value = isDomain ? rule.value : rule;
          const ruleType = isDomain ? rule.type : null;
          const actualIndex = isDomain
            ? rules.findIndex(r => r.value === value && r.type === ruleType)
            : rules.indexOf(rule);
          const isEditing = editingIndex === actualIndex;

          if (isEditing) {
            return (
              <div key={`${value}-${i}`} className="rule-item editing">
                {isDomain && (
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '0.1rem' }}
                  >
                    <option value="RootDomain">domain</option>
                    <option value="Full">full</option>
                    <option value="Plain">keyword</option>
                    <option value="Regex">regex</option>
                  </select>
                )}
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newRule = isDomain
                        ? { type: editType, value: editValue.trim(), attrs: rule.attrs || [] }
                        : editValue.trim();
                      if (editValue.trim()) onEdit(actualIndex, newRule);
                      setEditingIndex(null);
                    } else if (e.key === 'Escape') {
                      setEditingIndex(null);
                    }
                  }}
                  autoFocus
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.3rem' }}
                />
                <button className="btn btn-sm btn-success" onClick={() => {
                  const newRule = isDomain
                    ? { type: editType, value: editValue.trim(), attrs: rule.attrs || [] }
                    : editValue.trim();
                  if (editValue.trim()) onEdit(actualIndex, newRule);
                  setEditingIndex(null);
                }}>✓</button>
                <button className="btn btn-sm" onClick={() => setEditingIndex(null)}>✗</button>
              </div>
            );
          }

          return (
            <div key={`${value}-${i}`} className="rule-item">
              {ruleType && <span className="rule-type">{ruleType}</span>}
              <span className="rule-value" title={value}>{value}</span>
              <div className="rule-actions">
                <span
                  className="copy-btn"
                  onClick={() => {
                    setEditingIndex(actualIndex);
                    setEditValue(value);
                    if (isDomain) setEditType(ruleType);
                  }}
                  title="Edit"
                >
                  ✏️
                </span>
                <span
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                  }}
                  title="Copy"
                >
                  📋
                </span>
                <span
                  className="copy-btn"
                  onClick={() => {
                    if (actualIndex >= 0) onRemove(actualIndex);
                  }}
                  title="Remove"
                  style={{ color: 'var(--danger)' }}
                >
                  ✕
                </span>
              </div>
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
  );
}
