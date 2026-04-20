import { useState, useMemo, useEffect } from 'react';
import Pagination from './Pagination.jsx';
import { useI18n } from '../i18n.jsx';

// Валидация домена
const isValidDomain = (domain) => {
  // Поддержка простых доменов, поддоменов, regex и wildcard
  if (!domain) return false;
  // Базовая проверка: не может содержать опасные символы
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?$|^[a-zA-Z0-9\*\.\-]+$/;
  return domainRegex.test(domain);
};

// Валидация IP адреса (IPv4 и IPv6, включая CIDR нотацию)
const isValidCIDR = (cidr) => {
  if (!cidr) return false;
  // IPv4 CIDR: xxx.xxx.xxx.xxx/xx
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  // IPv6 CIDR: xxxx:xxxx:... или :: нотация
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$|^::([0-9a-fA-F]{0,4}:)*[0-9a-fA-F]{0,4}(\/\d{1,3})?$|^[0-9a-fA-F]{0,4}::(\/\d{1,3})?$/;
  
  if (ipv4Regex.test(cidr)) {
    const [ip, prefix] = cidr.split('/');
    const octets = ip.split('.').map(Number);
    if (octets.every(o => o >= 0 && o <= 255)) {
      if (prefix) return parseInt(prefix) >= 0 && parseInt(prefix) <= 32;
      return true;
    }
    return false;
  }
  return ipv6Regex.test(cidr);
};

export default function RuleEditor({ category, type, onAdd, onRemove, onEdit, loading }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('RootDomain');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState('');
  const [invalidRules, setInvalidRules] = useState(new Set()); // Отслеживание невалидных правил

  const isDomain = type === 'geosite' || type === 'domain';
  const rules = isDomain ? (category?.domains || []) : (category?.cidrs || []);

  // Валидация всех правил при загрузке
  useEffect(() => {
    const invalid = new Set();
    rules.forEach((rule, idx) => {
      const value = isDomain ? rule.value : rule;
      const isValid = isDomain ? isValidDomain(value) : isValidCIDR(value);
      if (!isValid) invalid.add(idx);
    });
    setInvalidRules(invalid);
  }, [rules, isDomain]);

  // Обработчик Ctrl+V для вставки правил
  useEffect(() => {
    const handlePaste = async (e) => {
      // Проверяем, что фокус на input в rule-list-container
      const ruleListContainer = document.querySelector('.rule-list-container');
      if (!ruleListContainer || !ruleListContainer.contains(document.activeElement)) return;
      
      // Не трогаем если это input редактирования (не в режиме редактирования)
      if (editingIndex !== null) return;

      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        // Парсим данные: могут быть разделены запятой или новой строкой
        const values = text
          .split(/[,\n\r]+/)
          .map(v => v.trim())
          .filter(v => v && v.length > 0);

        if (values.length === 0) return;

        // Валидируем все значения
        const isValid = values.every(v => isDomain ? isValidDomain(v) : isValidCIDR(v));
        if (!isValid) {
          // Если не все валидны, не добавляем ничего
          return;
        }

        // Добавляем все валидные правила
        if (isDomain) {
          values.forEach(v => {
            onAdd({ type: newType, value: v, attrs: [] });
          });
        } else {
          values.forEach(v => onAdd(v));
        }
      } catch (err) {
        // Ошибка при чтении clipboard - игнорируем
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isDomain, newType, onAdd, editingIndex]);

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
      // Support adding multiple values separated by newlines or commas
      const values = val.split(/[,\n\r]+/).map(v => v.trim()).filter(Boolean);
      // Валидируем перед добавлением
      const validValues = values.filter(v => isValidDomain(v));
      if (validValues.length === 0) return; // Не добавляем если нет валидных
      validValues.forEach(v => {
        onAdd({ type: newType, value: v, attrs: [] });
      });
    } else {
      // Support adding multiple values separated by newlines or commas
      const values = val.split(/[,\n\r]+/).map(v => v.trim()).filter(Boolean);
      // Валидируем перед добавлением
      const validValues = values.filter(v => isValidCIDR(v));
      if (validValues.length === 0) return; // Не добавляем если нет валидных
      validValues.forEach(v => onAdd(v));
    }
    setNewValue('');
  };

  if (!category) {
    return (
      <div className="rule-list-container">
        <div className="loading">{t('selectCategory')}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rule-list-container">
        <div className="loading"><div className="spinner" />{t('loadingRules')}</div>
      </div>
    );
  }

  return (
    <div className="rule-list-container">
      <div className="rule-toolbar">
        <input
          type="text"
          placeholder={t('filterRules')}
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
          placeholder={isDomain ? t('addDomainPlaceholder') : t('addCidrPlaceholder')}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-sm btn-success" onClick={handleAdd}>{t('addBtn')}</button>
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
                      const trimmed = editValue.trim();
                      if (!trimmed) return;
                      // Валидируем перед сохранением
                      const isValid = isDomain ? isValidDomain(trimmed) : isValidCIDR(trimmed);
                      if (!isValid) return; // Не сохраняем невалидные данные
                      
                      const newRule = isDomain
                        ? { type: editType, value: trimmed, attrs: rule.attrs || [] }
                        : trimmed;
                      onEdit(actualIndex, newRule);
                      setEditingIndex(null);
                    } else if (e.key === 'Escape') {
                      setEditingIndex(null);
                    }
                  }}
                  autoFocus
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.3rem' }}
                />
                <button className="btn btn-sm btn-success" onClick={() => {
                  const trimmed = editValue.trim();
                  if (!trimmed) return;
                  // Валидируем перед сохранением
                  const isValid = isDomain ? isValidDomain(trimmed) : isValidCIDR(trimmed);
                  if (!isValid) return; // Не сохраняем невалидные данные
                  
                  const newRule = isDomain
                    ? { type: editType, value: trimmed, attrs: rule.attrs || [] }
                    : trimmed;
                  onEdit(actualIndex, newRule);
                  setEditingIndex(null);
                }}>✓</button>
                <button className="btn btn-sm" onClick={() => setEditingIndex(null)}>✗</button>
              </div>
            );
          }

          return (
            <div key={`${value}-${i}`} className="rule-item">
              {invalidRules.has(actualIndex) && <span title="Invalid format" style={{ color: 'var(--warning)', fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>}
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
                  title={t('edit')}
                >
                  ✏️
                </span>
                <span
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                  }}
                  title={t('copy')}
                >
                  📋
                </span>
                <span
                  className="copy-btn"
                  onClick={() => {
                    if (actualIndex >= 0) onRemove(actualIndex);
                  }}
                  title={t('remove')}
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
