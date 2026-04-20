import { useState, useMemo } from 'react';
import Pagination from './Pagination.jsx';
import { useI18n } from '../i18n.jsx';

export default function CategoryList({ categories, selected, onSelect, onAdd, onRemove }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim().toUpperCase());
      setNewTag('');
      setAdding(false);
    }
  };

  const totalPages = Math.ceil(categories.length / pageSize);
  const visibleCategories = useMemo(() => {
    if (pageSize === Infinity) return categories;
    return categories.slice(0, page * pageSize);
  }, [categories, page, pageSize]);

  const offset = 0;

  return (
    <div className="category-list">
      <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-sm" onClick={() => setAdding(true)} style={{ width: '100%' }}>
          {t('addCategory')}
        </button>
      </div>

      {adding && (
        <div style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('tagPlaceholder')}
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
            <button className="btn btn-sm btn-success" onClick={handleAdd}>{t('add')}</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="category-items">
        {visibleCategories.map((cat, i) => {
          const realIndex = offset + i;
          return (
            <div
              key={`${cat.tag}-${realIndex}`}
              className={`category-item ${selected === realIndex ? 'active' : ''}`}
              onClick={() => onSelect(realIndex)}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.tag}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="count">{cat.count}</span>
                {categories.length > 1 && (
                  <span
                    className="copy-btn"
                    onClick={(e) => { e.stopPropagation(); onRemove(realIndex); }}
                    title={t('removeCategory')}
                  >
                    ✕
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {categories.length > 25 && (
        <Pagination
          total={categories.length}
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
