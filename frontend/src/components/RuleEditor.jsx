import { useState, useMemo } from 'react';

export default function RuleEditor({ category, type, onAdd, onRemove }) {
  const [filter, setFilter] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('RootDomain');

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
          onChange={(e) => setFilter(e.target.value)}
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
        {filteredRules.map((rule, i) => {
          const value = isDomain ? rule.value : rule;
          const ruleType = isDomain ? rule.type : null;

          return (
            <div key={`${value}-${i}`} className="rule-item">
              {ruleType && <span className="rule-type">{ruleType}</span>}
              <span className="rule-value" title={value}>{value}</span>
              <div className="rule-actions">
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
                    // Find actual index in unfiltered list
                    const actualIndex = isDomain
                      ? rules.findIndex(r => r.value === value && r.type === ruleType)
                      : rules.indexOf(rule);
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
    </div>
  );
}
