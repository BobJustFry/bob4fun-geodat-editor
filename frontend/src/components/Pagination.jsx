import { useI18n } from '../i18n.jsx';

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange, onLoadMore }) {
  const { t } = useI18n();
  const shown = Math.min(page * pageSize, total);
  const hasMore = shown < total;
  const remaining = total - shown;

  return (
    <div className="pagination">
      <div className="pagination-controls">
        <span className="pagination-info">
          {shown}/{total}
        </span>
        {hasMore && (
          <button className="btn btn-sm" onClick={onLoadMore}>
            {t('loadMore')} ({remaining})
          </button>
        )}
        {page > 1 && (
          <button className="btn btn-sm" onClick={() => onPageChange(1)}>
            {t('collapse')}
          </button>
        )}
      </div>
      <select
        className="pagination-size"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      >
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={Infinity}>{t('all')}</option>
      </select>
    </div>
  );
}
