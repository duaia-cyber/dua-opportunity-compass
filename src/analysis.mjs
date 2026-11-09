/**
 * Opportunity Compass Analysis Module
 * Analyzes opportunity text to extract structured items and compare versions.
 */

import { startsWordAt } from './insights.mjs';

const CATEGORIES = {
  deadline: ['deadline', 'due date', 'submission deadline', '截止日期', 'prazo final', 'data de entrega', 'applications close', 'closes on', 'prazo', 'candidaturas terminam'],
  eligibility: ['eligibility', 'eligible', 'ineligible', 'who can apply', 'requisitos', 'elegibilidade', 'inelegível'],
  documents: ['documents', 'required documents', 'application documents', 'documentos', 'documentos necessários', 'papéis'],
  costs: ['costs', 'fees', 'cost', 'co-financing', 'cofinancing', 'taxas', 'custos', 'taxa', 'cofinanciamento'],
  // "grant" alone is also a verb ("works grant the organiser a licence"), so only noun forms count.
  funding: ['funding', 'grants', 'a grant', 'the grant', 'grant of', 'grant amount', 'grant programme', 'grant program', 'financial support', 'financiamento', 'subvenção', 'apoio financeiro', 'apoio:']
};

const CATEGORY_KEYS = Object.keys(CATEGORIES);

// Embedded date regex patterns for exact preserved source lines
const MONTH_PATTERN = 'january|february|march|april|may|june|july|august|september|october|november|december|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec|fev|abr|mai|ago|set|out|dez';

const MONTHS = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
  'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
  'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
  'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12',
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05',
  'jun': '06', 'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

// Day counts per month (non-leap year)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getMaxDays(year, month) {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

function isValidDate(year, month, day) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > getMaxDays(y, m)) return false;
  return true;
}

// Helper to validate and normalize a date
function validateAndNormalize(year, month, day, raw) {
  if (!isValidDate(year, month, day)) {
    return { raw, iso: null, status: 'invalid' };
  }
  const iso = `${parseInt(year, 10)}-${parseInt(month, 10).toString().padStart(2, '0')}-${parseInt(day, 10).toString().padStart(2, '0')}`;
  return { raw, iso, status: 'explicit' };
}

function extractDatesFromLine(line) {
  const dates = [];
  // Prefer complete forms, then search the remaining text for incomplete ones.
  // A span is used only once, so a substring is never counted as a second date.
  const add = (match, value) => {
    const start = match.index;
    const end = start + match[0].length;
    if (dates.some((date) => start < date.end && end > date.start)) return;
    dates.push({ ...value, raw: match[0], start, end });
  };
  for (const match of line.matchAll(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g)) {
    add(match, validateAndNormalize(match[1], match[2], match[3], match[0]));
  }
  const dayFirst = new RegExp(`(?<![\\p{L}\\d])(\\d{1,2})\\s+(?:de\\s+)?(${MONTH_PATTERN})\\s+(?:de\\s+)?(\\d{4})(?!\\d)`, 'giu');
  for (const match of line.matchAll(dayFirst)) {
    add(match, validateAndNormalize(match[3], MONTHS[match[2].toLowerCase()], match[1], match[0]));
  }
  const monthFirst = new RegExp(`(?<![\\p{L}\\d])(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,)?\\s+(\\d{4})(?!\\d)`, 'giu');
  for (const match of line.matchAll(monthFirst)) {
    add(match, validateAndNormalize(match[3], MONTHS[match[1].toLowerCase()], match[2], match[0]));
  }
  for (const match of line.matchAll(/(?<![\d./])(\d{1,2})([/.])(\d{1,2})\2(\d{4})(?!\d)/g)) {
    const first = Number(match[1]);
    const second = Number(match[3]);
    const possible = (isValidDate(match[4], first, second) || isValidDate(match[4], second, first));
    add(match, { iso: null, status: possible ? 'ambiguous' : 'invalid' });
  }
  const incomplete = new RegExp(`(?<![\\p{L}\\d])(?:\\d{1,2}\\s+(?:de\\s+)?(?:${MONTH_PATTERN})|(?:${MONTH_PATTERN})\\s+\\d{1,2})(?![\\p{L}\\d])`, 'giu');
  for (const match of line.matchAll(incomplete)) add(match, { iso: null, status: 'incomplete' });
  // Day/month without a year. Dotted pairs such as "2.4" or "item 7.1" are clause
  // numbers in notices, so only the slash form is treated as a possible date.
  for (const match of line.matchAll(/(?<![\d./])\d{1,2}\/\d{1,2}(?![\d./])/g)) {
    add(match, { iso: null, status: 'incomplete' });
  }
  return dates.sort((a, b) => a.start - b.start);
}

// Words that tie a dated line to applying, closing, or to another phase of the call.
const SUBMIT = /(?<![\p{L}])(candidatur|inscri[çc]|submiss|submet|propostas|application|submission|entries|apply)/iu;
const CLOSE = /(?<![\p{L}])(termin|encerr|até|deadline|clos|until|no later than|data limite|prazo)/iu;
const OTHER_PHASE = /(?<![\p{L}])(relatório|report|execução|concretiza|decorrer|realiza[çc]|evento|event|júri|jury|decis|anúncio|announce|resultad|results|avalia|evaluat|assessment|sele[çc][ãa]o|selection|pagamento|payment|abertura|opening|publica[çc]|publication|início|vigência)/iu;
const DEADLINE_HEADING = /(?<![\p{L}])(prazo|prazos|deadline|deadlines|data limite|datas|calendário|timeline|dates)/iu;
// "between X and Y" is left ambiguous on purpose: it does not say which day closes.
const RANGE_CONNECTOR = /(?:^|\s)(?:a|até|ao|to|until|through)(?:\s|$)|[–—]/iu;

/**
 * Two dates joined by "de … a …", "from … to …" or "a partir de … até …" describe a
 * period. The closing date is the later one; an opening date without a year is not
 * completed. Any other combination of dates stays ambiguous.
 */
function resolveDates(line, dates) {
  if (dates.length === 1) return { iso: dates[0].iso, raw: dates[0].raw, status: dates[0].status };
  if (dates.length === 0) return null;
  const raw = line.slice(dates[0].start, dates[dates.length - 1].end);
  if (dates.length === 2) {
    const [first, last] = dates;
    const between = line.slice(first.end, last.start);
    const ordered = first.status === 'incomplete' || (first.status === 'explicit' && last.status === 'explicit' && first.iso <= last.iso);
    if (between.length <= 140 && RANGE_CONNECTOR.test(between) && ordered) {
      if (last.status === 'explicit') return { iso: last.iso, raw, status: 'explicit', range: true };
      if (last.status === 'incomplete' && first.status === 'incomplete') return { iso: null, raw, status: 'incomplete', range: true };
    }
  }
  return { iso: null, raw, status: 'ambiguous' };
}

/**
 * How strongly a dated line reads as the application deadline. Higher is stronger.
 * Only used to choose between several explicit dates; it never creates a date.
 */
function underDeadlineHeading(lines, index) {
  let seen = 0;
  for (let j = index - 1; j >= 0 && seen < 2; j--) {
    const previous = lines[j].trim();
    if (!previous) continue;
    seen += 1;
    if (previous.length <= 100 && DEADLINE_HEADING.test(previous) && SUBMIT.test(previous)) return true;
  }
  return false;
}

function deadlineScore(lines, index) {
  const line = lines[index];
  let score = 0;
  if (SUBMIT.test(line)) score += 2;
  if (CLOSE.test(line)) score += 2;
  if (OTHER_PHASE.test(line)) score -= 2;
  if (underDeadlineHeading(lines, index)) score += 3;
  return score;
}

// A section title such as "1. Deadline" or "Documentos" carries no requirement of its
// own; the clause underneath it does. Short titles without digits or a colon are skipped.
function isBareHeading(quote) {
  const body = quote.replace(/^(?:\d+(?:\.\d+)*[.)]?|[a-z][.)]|[ivx]+[.)])\s+/iu, '').trim();
  if (!body || /[:\d€$]/u.test(body)) return false;
  return body.split(/\s+/u).length <= 3 && !/[.;!?]$/u.test(body);
}

function getCategory(line) {
  const lower = line.toLowerCase();
  const categories = [];
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      // Match at the start of a word, so "cofinanciamento" is not read as "financiamento".
      if (startsWordAt(lower, keyword)) {
        categories.push(category);
        break;
      }
    }
  }
  return categories.length > 0 ? categories : null;
}

function extractLine(line) {
  return line.trim();
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Check for credentials
    if (parsed.username || parsed.password) {
      return null;
    }
    return url;
  } catch (e) {
    return null;
  }
}

function compareVersions(currentLines, previousLines) {
  const changes = [];
  
  // Count occurrences in each array using exact string keys (preserves __proto__, constructor, etc.)
  const currentCounts = {};
  const previousCounts = {};
  
  for (const line of currentLines) {
    const key = line;
    currentCounts[key] = (currentCounts[key] || 0) + 1;
  }
  
  for (const line of previousLines) {
    const key = line;
    previousCounts[key] = (previousCounts[key] || 0) + 1;
  }
  
  // Find added/changed lines (literal comparison, counts duplicates)
  for (const line of currentLines) {
    const key = line;
    if (!previousCounts[key] || previousCounts[key] === 0) {
      changes.push({ kind: 'added', quote: line });
    } else {
      previousCounts[key]--;
    }
  }
  
  // Find removed lines (literal comparison)
  for (const line of previousLines) {
    const key = line;
    if (!currentCounts[key] || currentCounts[key] === 0) {
      changes.push({ kind: 'removed', quote: line });
    } else {
      currentCounts[key]--;
    }
  }
  
  return changes;
}

/**
 * Analyze opportunity text and extract structured items.
 * @param {Object} params - Analysis parameters
 * @param {string} params.text - Current text to analyze
 * @param {string} params.previousText - Previous version for comparison (optional)
 * @param {string} params.url - Source URL (must be http or https)
 * @returns {Object} - Analysis result with items, changes, and sourceUrl
 */
export function analyse({ text, previousText, url }) {
  // Validate URL
  if (url) {
    const validatedUrl = validateUrl(url);
    if (validatedUrl === null) {
      throw new Error('Source URL must be valid http or https with no credentials');
    }
  }

  // Limit input size
  if (text && text.length > 100000) {
    throw new Error('Input text too large (max 100000 characters)');
  }

  if (previousText && previousText.length > 100000) {
    throw new Error('Previous text too large (max 100000 characters)');
  }

  const sourceUrl = url || null;

  // Split into lines preserving original content
  const lines = (text || '').split('\n').map(l => l);
  const previousLines = (previousText || '').split('\n').map(l => l);

  // Compare versions if previous text exists
  const changes = (previousText && previousText.length > 0)
    ? compareVersions(lines, previousLines)
    : [];

  // Extract items
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quote = extractLine(line);
    if (!quote) continue;

    if (isBareHeading(quote)) continue;
    const dates = extractDatesFromLine(line);
    let categories = getCategory(line) || [];
    // A dated line about applying, or under a heading such as "Prazo de candidatura",
    // is a deadline candidate even without the word "deadline".
    if (dates.length && !categories.includes('deadline') && (SUBMIT.test(line) || underDeadlineHeading(lines, i))) categories = ['deadline', ...categories];
    if (!categories.length) continue;

    // Build date object with raw, iso, status (and range for a closing date of a period)
    const finalDate = resolveDates(line, dates);
    const score = categories.includes('deadline') ? deadlineScore(lines, i) : null;

    // Generate deterministic ID from line position and category
    for (const category of categories) {
      const id = `item_${String(i + 1).padStart(4, '0')}_${category}`;
      
      items.push({
        id,
        category,
        line: i + 1,
        quote,
        date: finalDate,
        ...(category === 'deadline' ? { score } : {})
      });
    }
  }

  // Cap items at 200
  const MAX_ITEMS = 200;
  const itemsTruncated = items.length > MAX_ITEMS;
  if (itemsTruncated) {
    items.splice(MAX_ITEMS);
  }

  // Cap changes at 200
  const MAX_CHANGES = 200;
  const changesTruncated = changes.length > MAX_CHANGES;
  if (changesTruncated) {
    changes.splice(MAX_CHANGES);
  }

  return { items, changes, sourceUrl, itemsTruncated, changesTruncated };
}

export default { analyse };
