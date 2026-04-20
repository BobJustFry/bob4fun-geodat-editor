import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    // Header
    convert: '⇄ Convert',
    about: 'ℹ About',
    lightTheme: 'Switch to light theme',
    darkTheme: 'Switch to dark theme',

    // Editor panel
    editor: 'Editor',
    donor: 'Donor',
    donorHint: '— drag a file to use as source',
    save: '↓ Save',
    closeEditor: 'Close Editor',
    closeDonor: 'Close Donor',
    unsavedChanges: 'Editor has unsaved changes. Close anyway?',

    // File uploader
    loadingFile: 'Loading file...',
    urlPlaceholder: 'Paste a URL to a file...',
    fetch: '↓ Fetch',
    dropFile: 'Drop a file here or click to browse',
    supports: 'Supports: .dat (V2Ray), .mrs (Mihomo), .txt, .yaml',

    // Category list
    addCategory: '+ Category',
    tagPlaceholder: 'TAG name',
    add: 'Add',
    cancel: 'Cancel',
    removeCategory: 'Remove category',

    // Rule editor
    selectCategory: 'Select a category',
    filterRules: 'Filter rules...',
    addDomainPlaceholder: 'Add domain (e.g. google.com)',
    addCidrPlaceholder: 'Add CIDR (e.g. 10.0.0.0/8)',
    addBtn: '+ Add',
    edit: 'Edit',
    copy: 'Copy',
    remove: 'Remove',

    // Donor panel
    selected: 'selected',
    copyToEditor: '→ Copy to Editor',
    copyGroup: '→ Copy Group',
    copyGroupTitle: 'Copy entire category to editor',
    clear: 'Clear',
    selectAll: 'Select All',
    filter: 'Filter...',

    // Pagination
    loadMore: '+ Load more',
    collapse: 'Collapse',
    all: 'All',

    // Convert modal
    convertDownload: 'Convert & Download',
    source: 'Source',
    targetFormat: 'Target Format',
    converting: 'Converting...',
    convertBtn: 'Convert & Download',

    // About modal
    aboutTitle: 'Geodat Editor',
    aboutDesc: 'Web editor for geoip/geosite rule files.',
    aboutDesc2: 'Supports V2Ray .dat, Mihomo .mrs, text and YAML formats.',
    featureEdit: '📝 Edit rules & categories inline',
    featureLoad: '📂 Load files via drag & drop or URL',
    featureSplit: '🔀 Split view with donor panel',
    featureExport: '💾 Export to .dat, .mrs, .txt',
    madeBy: 'Made by',

    // Donate
    donate: 'Donate',
    clickToCopy: 'Click to copy',
    walletCopied: 'Copied!',

    // Status bar
    categories: 'categories',

    // Toasts
    loaded: 'Loaded',
    donorLoaded: 'Donor loaded',
    downloaded: 'Downloaded',
    convertedTo: 'Converted to',
    copied: 'Copied',
    copiedDomains: 'domains',
    copiedCidrs: 'CIDRs',
  },
  ru: {
    // Header
    convert: '⇄ Конвертировать',
    about: 'ℹ О программе',
    lightTheme: 'Светлая тема',
    darkTheme: 'Тёмная тема',

    // Editor panel
    editor: 'Редактор',
    donor: 'Донор',
    donorHint: '— перетащите файл для использования как источник',
    save: '↓ Сохранить',
    closeEditor: 'Закрыть редактор',
    closeDonor: 'Закрыть донор',
    unsavedChanges: 'Есть несохранённые изменения. Закрыть?',

    // File uploader
    loadingFile: 'Загрузка файла...',
    urlPlaceholder: 'Вставьте URL файла...',
    fetch: '↓ Загрузить',
    dropFile: 'Перетащите файл сюда или нажмите для выбора',
    supports: 'Поддерживает: .dat (V2Ray), .mrs (Mihomo), .txt, .yaml',

    // Category list
    addCategory: '+ Категория',
    tagPlaceholder: 'Имя тега',
    add: 'Добавить',
    cancel: 'Отмена',
    removeCategory: 'Удалить категорию',

    // Rule editor
    selectCategory: 'Выберите категорию',
    filterRules: 'Фильтр правил...',
    addDomainPlaceholder: 'Добавить домен (напр. google.com)',
    addCidrPlaceholder: 'Добавить CIDR (напр. 10.0.0.0/8)',
    addBtn: '+ Добавить',
    edit: 'Редактировать',
    copy: 'Копировать',
    remove: 'Удалить',

    // Donor panel
    selected: 'выбрано',
    copyToEditor: '→ В редактор',
    copyGroup: '→ Копировать группу',
    copyGroupTitle: 'Копировать всю категорию в редактор',
    clear: 'Сбросить',
    selectAll: 'Выбрать все',
    filter: 'Фильтр...',

    // Pagination
    loadMore: '+ Ещё',
    collapse: 'Свернуть',
    all: 'Все',

    // Convert modal
    convertDownload: 'Конвертировать и скачать',
    source: 'Источник',
    targetFormat: 'Формат',
    converting: 'Конвертация...',
    convertBtn: 'Конвертировать и скачать',

    // About modal
    aboutTitle: 'Geodat Editor',
    aboutDesc: 'Веб-редактор файлов правил geoip/geosite.',
    aboutDesc2: 'Поддерживает V2Ray .dat, Mihomo .mrs, текстовые и YAML форматы.',
    featureEdit: '📝 Редактирование правил и категорий',
    featureLoad: '📂 Загрузка через drag & drop или URL',
    featureSplit: '🔀 Режим Split View с донором',
    featureExport: '💾 Экспорт в .dat, .mrs, .txt',
    madeBy: 'Автор',

    // Donate
    donate: 'Донат',
    clickToCopy: 'Нажмите для копирования',
    walletCopied: 'Скопировано!',

    // Status bar
    categories: 'категорий',

    // Toasts
    loaded: 'Загружено',
    donorLoaded: 'Донор загружен',
    downloaded: 'Скачан',
    convertedTo: 'Сконвертирован в',
    copied: 'Скопировано',
    copiedDomains: 'доменов',
    copiedCidrs: 'CIDR',
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const setLanguage = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
