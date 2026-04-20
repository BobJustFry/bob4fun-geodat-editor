import { useState } from 'react';

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="pagination">
      <div className="pagination-controls">
        <button
          className="btn btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        <span className="pagination-info">
          {page}/{totalPages || 1} ({total})
        </span>
        <button
          className="btn btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
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
