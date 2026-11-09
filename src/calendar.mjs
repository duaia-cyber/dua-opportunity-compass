/**
 * iCalendar helpers for all-day references.
 * Nothing here schedules anything: the user downloads a file and imports it by hand.
 * Every event is a whole day; the exact time and time zone stay in the original notice.
 */

const encoder = new TextEncoder();

function validateIso(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error('Invalid ISO date format');
  }
  const date = new Date(iso + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  // Verify the date components match (catches invalid dates like 2026-13-40)
  const parts = iso.split('-');
  if (Number(parts[0]) < 1900 || Number(parts[0]) > 9998 || parts[0] !== String(date.getUTCFullYear()) ||
      String(date.getUTCMonth() + 1).padStart(2, '0') !== parts[1] ||
      String(date.getUTCDate()).padStart(2, '0') !== parts[2]) {
    throw new Error('Invalid calendar day');
  }
  return date;
}

// Reject javascript: and URLs with credentials
function safeSourceUrl(sourceUrl) {
  if (!sourceUrl) return '';
  try {
    const urlObj = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(urlObj.protocol) || urlObj.username || urlObj.password) throw new Error('Invalid source URL');
    return urlObj.href;
  } catch (e) {
    throw new Error('Invalid source URL');
  }
}

function validateUid(uid) {
  if (typeof uid !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(uid)) throw new Error('Invalid UID');
  return uid;
}

// Escape backslashes, newlines, commas and semicolons in iCalendar text values
function escapeText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n?|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatStamp(now) {
  const nowDate = new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error('Invalid timestamp');
  return nowDate.getUTCFullYear() +
    String(nowDate.getUTCMonth() + 1).padStart(2, '0') +
    String(nowDate.getUTCDate()).padStart(2, '0') + 'T' +
    String(nowDate.getUTCHours()).padStart(2, '0') +
    String(nowDate.getUTCMinutes()).padStart(2, '0') +
    String(nowDate.getUTCSeconds()).padStart(2, '0') + 'Z';
}

function dayStamp(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function allDayEvent({ iso, uid, summary, description, url, dtstamp }) {
  const date = validateIso(iso);
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  const lines = [
    'BEGIN:VEVENT',
    'UID:' + validateUid(uid) + '@opportunity-compass.local',
    'DTSTAMP:' + dtstamp,
    'DTSTART;VALUE=DATE:' + dayStamp(date),
    'DTEND;VALUE=DATE:' + dayStamp(end),
    'SUMMARY:' + escapeText(summary),
    'DESCRIPTION:' + escapeText(description)
  ];
  if (url) lines.push('URL:' + url);
  lines.push('END:VEVENT');
  return lines;
}

// RFC 5545: fold lines at 75 UTF-8 octets without splitting a code point.
function fold(line) {
  const segments = [];
  let segment = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { segments.push(segment); segment = ' '; bytes = 1; }
    segment += character;
    bytes += size;
  }
  segments.push(segment);
  return segments.join('\r\n');
}

function wrapCalendar(eventLines) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DUA//Opportunity Compass//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventLines,
    'END:VCALENDAR'
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * Creates a standards-compatible CRLF iCalendar file for one all-day reference.
 * @param {Object} options
 * @param {string} options.iso - ISO date string (YYYY-MM-DD)
 * @param {string} options.quote - The quoted deadline line
 * @param {string} options.sourceUrl - Source URL (optional)
 * @param {string} options.language - 'en' or 'pt'
 * @param {string} options.uid - Unique identifier
 * @param {Date} options.now - Current date/time for DTSTAMP
 * @param {boolean} options.example - Whether the text is the fictional example
 * @returns {string} iCalendar content with CRLF line endings
 */
export function createCalendarReference({ iso, quote, sourceUrl, language, uid, now, example = false }) {
  validateIso(iso);
  const url = safeSourceUrl(sourceUrl);
  validateUid(uid);
  const pt = language === 'pt';
  const prefix = example ? (pt ? 'EXEMPLO FICTÍCIO: ' : 'FICTIONAL EXAMPLE: ') : '';
  const summary = prefix + (pt ? 'Rever dia de prazo' : 'Review deadline day');
  const description = (example ? (pt ? 'EXEMPLO FICTÍCIO. ' : 'FICTIONAL EXAMPLE. ') : '') +
    (pt ? 'Referência de dia inteiro. Confirma a hora e o fuso no aviso original.' : 'All-day reference. Confirm the exact time and time zone in the original notice.') +
    '\n' + quote;
  return wrapCalendar(allDayEvent({ iso, uid, summary, description, url, dtstamp: formatStamp(now) }));
}

/**
 * Creates one iCalendar file with several all-day events: the deadline day and
 * suggested working milestones. The caller supplies the wording, so the file can
 * state clearly which days are suggestions and which day comes from the notice.
 * @param {Object} options
 * @param {Array<{iso:string, uid:string, summary:string, description:string}>} options.events
 * @param {string} options.sourceUrl - Source URL (optional)
 * @param {Date} options.now - Current date/time for DTSTAMP
 * @returns {string} iCalendar content with CRLF line endings
 */
export function createPlanCalendar({ events, sourceUrl, now }) {
  if (!Array.isArray(events) || events.length === 0 || events.length > 20) throw new Error('Invalid events');
  const url = safeSourceUrl(sourceUrl);
  const dtstamp = formatStamp(now);
  const lines = [];
  for (const event of events) {
    if (!event || typeof event !== 'object') throw new Error('Invalid event');
    lines.push(...allDayEvent({ iso: event.iso, uid: event.uid, summary: event.summary, description: event.description, url, dtstamp }));
  }
  return wrapCalendar(lines);
}
