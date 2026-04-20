import { useState, useMemo } from 'react';
import Pagination from './Pagination.jsx';
import { useI18n } from '../i18n.jsx';

export default function CategoryList({ categories, selected, onSelect, onAdd, onRemove, width, readOnly }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTag, setEditTag] = useState('');
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim().toUpperCase());
      setNewTag('');
      setAdding(false);
    }
  };

  const startEditing = (index, tag) => {
    setEditingIndex(index);
    setEditTag(tag);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditTag('');
  };

  const handleSaveEdit = () => {
    const trimmed = editTag.trim().toUpperCase();
    if (!trimmed || editingIndex === null) return;
    if (categories.some((cat, index) => index !== editingIndex && cat.tag === trimmed)) return;
    onAdd(trimmed, editingIndex);
    cancelEditing();
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
  };

  const getSortIcon = () => {
    return sortOrder === 'asc' ? '▲' : sortOrder === 'desc' ? '▼' : '⇅';
  };

  // Filter categories and keep original indices
  const filteredAndSortedCategories = useMemo(() => {
    let result = categories.map((cat, i) => ({ cat, originalIndex: i })).filter(({ cat }) => {
      if (!filter) return true;
      return cat.tag.toLowerCase().includes(filter.toLowerCase());
    });
    
    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.cat.tag.localeCompare(b.cat.tag));
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.cat.tag.localeCompare(a.cat.tag));
    }
    
    return result;
  }, [categories, filter, sortOrder]);

  const visibleCategories = useMemo(() => {
    if (pageSize === Infinity) return filteredAndSortedCategories;
    return filteredAndSortedCategories.slice(0, page * pageSize);
  }, [filteredAndSortedCategories, page, pageSize]);

  return (
    <div className="category-list" style={width ? { width: `${width}px` } : undefined}>
      <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={t('filterCategories')}
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          style={{
            flex: 1,
            padding: '0.3rem 0.5rem',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            color: 'var(--text)',
            fontSize: '0.8rem',
            outline: 'none'
          }}
        />
        <button 
          className="icon-btn" 
          onClick={toggleSort}
          title={sortOrder === 'none' ? 'Sort A-Z' : sortOrder === 'asc' ? 'Sort Z-A' : 'No sort'}
          style={{ width: '28px', height: '28px', padding: 0, flexShrink: 0 }}
        >
          {getSortIcon()}
        </button>
      </div>

      {!readOnly && (
        <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
          <button className="btn btn-sm" onClick={() => setAdding(true)} style={{ width: '100%' }}>
            {t('addCategory')}
          </button>
        </div>
      )}

      {!readOnly && adding && (
        <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('tagPlaceholder')}
            autoFocus
            style={{
              width: '100%',
              padding: '0.3rem 0.5rem',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              color: 'var(--text)',
              fontSize: '0.8rem'
            }}
          />
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            <button className="btn btn-sm btn-success" onClick={handleAdd} style={{ flex: 1 }}>{t('add')}</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)} style={{ flex: 1 }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="category-items">
        {visibleCategories.map(({ cat, originalIndex }) => (
          editingIndex === originalIndex ? (
            <div key={`${cat.tag}-${originalIndex}`} className="category-item editing">
              <input
                type="text"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') cancelEditing();
                }}
                autoFocus
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.2rem 0.4rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                <button className="btn btn-sm btn-success" onClick={handleSaveEdit}>{t('add')}</button>
                <button className="btn btn-sm" onClick={cancelEditing}>{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div
              key={`${cat.tag}-${originalIndex}`}
              className={`category-item ${selected === originalIndex ? 'active' : ''}`}
              onClick={() => onSelect(originalIndex)}
              onDoubleClick={() => {
                if (!readOnly) startEditing(originalIndex, cat.tag);
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.tag}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="count">{cat.count}</span>
                {!readOnly && (
                  <span
                    className="copy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(originalIndex, cat.tag);
                    }}
                    title={t('edit')}
                  >
                    ✏️
                  </span>
                )}
                {!readOnly && categories.length > 1 && (
                  <span
                    className="copy-btn"
                    onClick={(e) => { e.stopPropagation(); onRemove(originalIndex); }}
                    title={t('removeCategory')}
                  >
                    ✕
                  </span>
                )}
              </div>
            </div>
          )
        ))}
      </div>

      {filteredAndSortedCategories.length > 25 && (
        <Pagination
          total={filteredAndSortedCategories.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          onLoadMore={() => setPage(p => p + 1)}
        />
      )}
    </div>
  );
}
