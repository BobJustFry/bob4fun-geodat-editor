import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import CategoryList from './CategoryList.jsx';
import Pagination from './Pagination.jsx';
import { useI18n } from '../i18n.jsx';
import useResizable from './useResizable.js';

export default function DonorPanel({ data, selectedCat, onSelectCat, onCopyRules, type, onClose, loading }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState('');
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const donorResize = useResizable({ storageKey: 'donor-cat-width' });

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

  // Drag-to-select
  const dragRef = useRef({ active: false, selecting: true });
  const ruleListRef = useRef(null);
  const scrollTimerRef = useRef(null);

  const handleDragStart = useCallback((index) => {
    const selecting = !selectedRules.has(index);
    dragRef.current = { active: true, selecting };
    const next = new Set(selectedRules);
    if (selecting) next.add(index); else next.delete(index);
    setSelectedRules(next);
  }, [selectedRules]);

  const handleDragEnter = useCallback((index) => {
    if (!dragRef.current.active) return;
    setSelectedRules(prev => {
      const next = new Set(prev);
      if (dragRef.current.selecting) next.add(index); else next.delete(index);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      dragRef.current.active = false;
      if (scrollTimerRef.current) {
        cancelAnimationFrame(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };

    const EDGE_ZONE = 60; // px from edge to start scrolling
    const MAX_SPEED = 20; // max px per frame

    const handleMouseMove = (e) => {
      if (!dragRef.current.active || !ruleListRef.current) return;
      const rect = ruleListRef.current.getBoundingClientRect();
      let speed = 0;

      if (e.clientY < rect.top) {
        // Above the list — scroll up
        const dist = Math.min(rect.top - e.clientY, EDGE_ZONE);
        speed = -(dist / EDGE_ZONE) * MAX_SPEED;
      } else if (e.clientY > rect.bottom) {
        // Below the list — scroll down
        const dist = Math.min(e.clientY - rect.bottom, EDGE_ZONE);
        speed = (dist / EDGE_ZONE) * MAX_SPEED;
      } else if (e.clientY < rect.top + EDGE_ZONE) {
        // Near top edge inside
        const dist = EDGE_ZONE - (e.clientY - rect.top);
        speed = -(dist / EDGE_ZONE) * MAX_SPEED;
      } else if (e.clientY > rect.bottom - EDGE_ZONE) {
        // Near bottom edge inside
        const dist = EDGE_ZONE - (rect.bottom - e.clientY);
        speed = (dist / EDGE_ZONE) * MAX_SPEED;
      }

      if (speed !== 0) {
        const doScroll = () => {
          if (!dragRef.current.active || !ruleListRef.current) return;
          ruleListRef.current.scrollTop += speed;
          scrollTimerRef.current = requestAnimationFrame(doScroll);
        };
        if (!scrollTimerRef.current) {
          scrollTimerRef.current = requestAnimationFrame(doScroll);
        }
      } else {
        if (scrollTimerRef.current) {
          cancelAnimationFrame(scrollTimerRef.current);
          scrollTimerRef.current = null;
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollTimerRef.current) cancelAnimationFrame(scrollTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    const selected = filteredRules.filter((_, i) => selectedRules.has(i));
    onCopyRules(selected);
    setSelectedRules(new Set());
  };

  const handleCopyGroup = () => {
    onCopyRules(rules);
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
      <div className="panel-body" style={{ flexDirection: 'row' }} ref={donorResize.containerRef}>
        <CategoryList
          categories={data.categories}
          selected={selectedCat}
          onSelect={(i) => { onSelectCat(i); setSelectedRules(new Set()); setFilter(''); }}
          onAdd={() => {}}
          onRemove={() => {}}
          width={donorResize.width}
        />
        <div className="resize-handle" onMouseDown={donorResize.onMouseDown} />
        <div className="rule-list-container">
          <div className="rule-toolbar">
            <input
              type="text"
              placeholder={t('filter')}
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            />
            <button className="btn btn-sm" onClick={selectAll}>{t('selectAll')}</button>
            <button className="btn btn-sm btn-success" onClick={handleCopyGroup} title={t('copyGroupTitle')}>{t('copyGroup')}</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredRules.length}/{rules.length}
            </span>
          </div>
          <div className="rule-list" ref={ruleListRef}>
            {loading ? (
              <div className="loading"><div className="spinner" />{t('loadingRules')}</div>
            ) : paginatedRules.map((rule, i) => {
              const globalIndex = pageOffset + i;
              const value = isDomain ? rule.value : rule;
              const ruleType = isDomain ? rule.type : null;
              const isSelected = selectedRules.has(globalIndex);

              return (
                <div
                  key={`${value}-${i}`}
                  className={`rule-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleRule(globalIndex)}
                  onMouseDown={(e) => { e.preventDefault(); handleDragStart(globalIndex); }}
                  onMouseEnter={() => handleDragEnter(globalIndex)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRule(globalIndex)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ accentColor: 'var(--accent)', pointerEvents: 'none' }}
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
