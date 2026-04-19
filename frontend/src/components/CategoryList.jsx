import { useState } from 'react';

export default function CategoryList({ categories, selected, onSelect, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim().toUpperCase());
      setNewTag('');
      setAdding(false);
    }
  };

  return (
    <div className="category-list">
      <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-sm" onClick={() => setAdding(true)} style={{ width: '100%' }}>
          + Category
        </button>
      </div>

      {adding && (
        <div style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="TAG name"
            autoFocus
            style={{
              width: '100%',
              padding: '0.3rem',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              color: 'var(--text)',
              fontSize: '0.8rem'
            }}
          />
          <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.2rem' }}>
            <button className="btn btn-sm btn-success" onClick={handleAdd}>Add</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {categories.map((cat, i) => (
        <div
          key={`${cat.tag}-${i}`}
          className={`category-item ${selected === i ? 'active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.tag}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="count">{cat.count}</span>
            {categories.length > 1 && (
              <span
                className="copy-btn"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                title="Remove category"
              >
                ✕
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
