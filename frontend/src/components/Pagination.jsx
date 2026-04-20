export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange, onLoadMore }) {
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
            + Load more ({remaining})
          </button>
        )}
        {page > 1 && (
          <button className="btn btn-sm" onClick={() => onPageChange(1)}>
            Collapse
          </button>
        )}
      </div>
      <select
        className="pagination-size"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={Infinity}>All</option>
      </select>
    </div>
  );
}
