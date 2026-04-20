const BASE = '/api';

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}

export async function uploadFromUrl(url) {
  const res = await fetch(`${BASE}/upload/from-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'URL fetch failed');
  return res.json();
}

export async function fetchRawFile(sessionId, filename) {
  const res = await fetch(`${BASE}/upload/raw/${encodeURIComponent(sessionId)}/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error('Failed to download raw file');
  return res.arrayBuffer();
}

export async function parseFile(sessionId, filename) {
  const res = await fetch(`${BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, filename })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Parse failed');
  return res.json();
}

export async function fetchCategoryRules(sessionId, filename, categoryIndex) {
  const res = await fetch(`${BASE}/parse/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, filename, categoryIndex })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Fetch rules failed');
  return res.json();
}

export async function convertFile(categories, sourceFormat, targetFormat, type) {
  const res = await fetch(`${BASE}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories, sourceFormat, targetFormat, type })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Convert failed');
  return res.json();
}

export async function downloadFile(categories, format, type, outputName) {
  const res = await fetch(`${BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories, format, type, outputName })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Download failed');
  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'output';
  return { blob, filename };
}
