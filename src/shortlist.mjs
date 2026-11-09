/**
 * Opportunity Compass Shortlist Module
 * Summarises analysed calls so a person can compare them side by side.
 * Pure functions: nothing is stored or sent; the interface keeps the list in memory.
 */

/** Short, stable key for a text, so the same call is not added twice. */
export function textKey(text) {
  let hash = 5381;
  const value = String(text || '');
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  return `${hash.toString(16)}-${value.length}`;
}

/** First meaningful line of the notice, without a "fictional example" prefix, at most 90 characters. */
export function titleFrom(text, fallback = 'Untitled call') {
  const line = String(text || '').split('\n').map((value) => value.trim()).find(Boolean) || '';
  const clean = line.replace(/^(FICTIONAL EXAMPLE|EXEMPLO FICTÍCIO)\s*[—–-]\s*/iu, '').trim();
  if (!clean) return fallback;
  return clean.length > 90 ? `${clean.slice(0, 89).trimEnd()}…` : clean;
}

function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86400000);
}

/**
 * One row of the shortlist.
 * @param {Object} analysis - result of analyse() enriched with signals, gaps, amounts, checklist, deadlines
 */
export function summarize({ text, title, analysis, ready = 0, today, example = false }) {
  const deadline = analysis.deadlines?.[0] || null;
  const gaps = analysis.gaps || [];
  let deadlineStatus = 'none';
  if (deadline) deadlineStatus = 'explicit';
  else if (gaps.includes('deadlineRelative')) deadlineStatus = 'relative';
  else if (gaps.includes('deadlineDate')) deadlineStatus = 'unclear';
  const total = (analysis.checklist || []).length;
  return {
    key: textKey(text),
    title: title || titleFrom(text),
    deadline: deadline ? deadline.date.iso : null,
    deadlineStatus,
    daysLeft: deadline ? daysBetween(today, deadline.date.iso) : null,
    amount: analysis.amounts?.[0]?.raw ?? null,
    alerts: (analysis.signals || []).filter((signal) => !signal.unspecified).length,
    gaps: gaps.length,
    readiness: total ? Math.round(Math.min(ready, total) / total * 100) : null,
    example: Boolean(example)
  };
}

/** Adds or replaces an entry by key, keeping at most 30 entries. */
export function upsert(entries, entry) {
  const next = entries.filter((existing) => existing.key !== entry.key);
  next.push(entry);
  return next.slice(-30);
}

/**
 * Sorts a copy of the list. "deadline": soonest open date first, then passed dates,
 * then calls without an explicit date. "alerts" and "gaps": most first. "readiness": highest first.
 */
export function sortEntries(entries, by = 'deadline') {
  const list = [...entries];
  const rank = (entry) => (entry.daysLeft === null ? 2 : entry.daysLeft < 0 ? 1 : 0);
  const comparators = {
    deadline: (a, b) => rank(a) - rank(b) || (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || a.title.localeCompare(b.title),
    alerts: (a, b) => b.alerts - a.alerts || a.title.localeCompare(b.title),
    gaps: (a, b) => b.gaps - a.gaps || a.title.localeCompare(b.title),
    readiness: (a, b) => (b.readiness ?? -1) - (a.readiness ?? -1) || a.title.localeCompare(b.title)
  };
  return list.sort(comparators[by] || comparators.deadline);
}

// A cell starting with =, +, - or @ (or a control character) can run as a formula in a spreadsheet.
function csvCell(value) {
  // Numbers (such as -5 days left) stay numbers; only text can carry a formula.
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV for spreadsheets. `labels` supplies the header and the words for deadline states.
 */
export function toCsv(entries, labels) {
  const header = [labels.title, labels.deadline, labels.daysLeft, labels.amount, labels.alerts, labels.gaps, labels.readiness];
  const rows = entries.map((entry) => [
    entry.title + (entry.example ? ` (${labels.example})` : ''),
    entry.deadline || labels.status[entry.deadlineStatus],
    entry.daysLeft ?? '',
    entry.amount ?? '',
    entry.alerts,
    entry.gaps,
    entry.readiness === null ? '' : `${entry.readiness}%`
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
