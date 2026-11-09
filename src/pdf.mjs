/**
 * Opportunity Compass PDF Module
 * Reads the text layer of a PDF inside the browser with pdf.js (vendored under
 * /vendor/pdfjs, Apache-2.0). Nothing is uploaded. Scanned pages have no text
 * layer: they are reported as such, never OCR'd or guessed.
 *
 * The pure functions below turn pdf.js text items into lines and are unit-tested
 * against items captured from pdf.js itself (tests/fixtures/notice-items.json).
 */

const PDF_WORKER = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
const DEFAULT_MAX_CHARS = 150000;
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_PAGES = 300;

export class PdfError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PdfError';
    this.code = code;
  }
}

const ENDS_SENTENCE = /[.:;!?…)\]»”"]$/u;
const STARTS_LOWER = /^\p{Ll}/u;
// A line that ends on a preposition or conjunction always continues on the next line.
const ENDS_OPEN = /(?:^|\s)(?:a|à|às|até|ao|aos|de|do|da|dos|das|e|em|no|na|nos|nas|por|para|com|o|os|as|que|the|of|to|and|or|at|on|in|for|by|from|until|with)$/iu;

/**
 * Groups the text items of one page into visual lines, top to bottom and left to right.
 * A space is inserted between items when the horizontal gap between them is visible.
 * @param {Array<{str:string, x:number, y:number, w:number, h:number}>} items
 * @returns {Array<{text:string, y:number, h:number}>}
 */
export function linesFromItems(items) {
  const usable = (items || []).filter((item) => item && typeof item.str === 'string');
  const columns = splitColumns(usable);
  const lines = [];
  columns.forEach((columnItems, column) => {
    groupRows(columnItems).forEach((row, index) => {
      const text = joinItems(row.items);
      if (text) lines.push({ text, y: row.y, h: row.h, ...(column > 0 && index === 0 ? { columnBreak: true } : {}) });
    });
  });
  return lines;
}

function groupRows(items) {
  const rows = [];
  for (const item of items) {
    const h = Math.abs(Number(item.h)) || 10;
    const tolerance = Math.max(2, h * 0.4);
    let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (!row) {
      row = { y: item.y, h, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }
  rows.sort((a, b) => b.y - a.y);
  for (const row of rows) row.items.sort((a, b) => a.x - b.x);
  return rows;
}

/**
 * Finds a vertical gutter in the middle of the page that (almost) no text crosses,
 * with a fair share of text on each side. Such a page is read as two columns: the
 * whole left column first, then the right one. Columns often have different
 * baselines, so the gutter is found from horizontal coverage, not from shared rows.
 */
function splitColumns(items) {
  const text = items.filter((item) => item.str.trim());
  if (text.length < 12) return [items];
  const maxX = Math.max(...text.map((item) => item.x + (Number(item.w) || 0)));
  const minX = Math.min(...text.map((item) => item.x));
  const width = maxX - minX;
  if (width < 200) return [items];
  const step = 2;
  const from = minX + width * 0.3;
  const to = minX + width * 0.7;
  const bins = Math.ceil((to - from) / step);
  const coverage = new Array(bins).fill(0);
  for (const item of text) {
    const a = Math.max(0, Math.floor((item.x - from) / step));
    const b = Math.min(bins - 1, Math.floor((item.x + (Number(item.w) || 0) - from) / step));
    for (let i = a; i <= b; i++) coverage[i] += 1;
  }
  const crossLimit = Math.max(1, Math.floor(text.length * 0.03));
  let best = null;
  let runStart = null;
  for (let i = 0; i <= bins; i++) {
    const open = i < bins && coverage[i] <= crossLimit;
    if (open && runStart === null) runStart = i;
    if (!open && runStart !== null) {
      if (!best || i - runStart > best.length) best = { start: runStart, length: i - runStart };
      runStart = null;
    }
  }
  if (!best || best.length * step < 8) return [items];
  const gutter = from + (best.start + best.length / 2) * step;
  const left = [];
  const right = [];
  for (const item of items) (item.x + (Number(item.w) || 0) / 2 < gutter ? left : right).push(item);
  const leftText = left.filter((item) => item.str.trim()).length;
  const rightText = right.filter((item) => item.str.trim()).length;
  if (leftText < text.length * 0.2 || rightText < text.length * 0.2) return [items];
  return [left, right];
}

function joinItems(items) {
  let text = '';
  let end = null;
  for (const item of items) {
    const h = Math.abs(Number(item.h)) || 10;
    if (!item.str.trim()) {
      if (text && !text.endsWith(' ')) text += ' ';
      end = item.x + (Number(item.w) || 0);
      continue;
    }
    if (text && !text.endsWith(' ') && end !== null && item.x - end > h * 0.08) text += ' ';
    text += item.str;
    end = item.x + (Number(item.w) || 0);
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Inserts an empty line where the vertical gap between two lines is clearly larger
 * than the usual line spacing of the page, so paragraphs stay apart.
 * @param {Array<{text:string, y:number}>} lines
 * @returns {string[]}
 */
export function paragraphsFromLines(lines) {
  const out = [];
  const gaps = [];
  for (let i = 1; i < lines.length; i++) gaps.push(lines[i - 1].y - lines[i].y);
  const positive = gaps.filter((gap) => gap > 0).sort((a, b) => a - b);
  const median = positive.length ? positive[Math.floor(positive.length / 2)] : 0;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && (lines[i].columnBreak || (median && gaps[i - 1] > median * 1.5))) out.push('');
    out.push(lines[i].text);
  }
  return out;
}

/**
 * Re-joins sentences that a PDF wrapped across lines: a line is appended to the
 * previous one when that line does not end with sentence punctuation and the new
 * line starts with a lowercase letter. Blank lines are never crossed, headings and
 * numbered clauses stay separate, and a trailing hyphen is kept.
 * @param {string[]} lines
 * @returns {string[]}
 */
export function reflow(lines) {
  const out = [];
  for (const line of lines) {
    const prev = out.length ? out[out.length - 1] : null;
    if (prev && line && !ENDS_SENTENCE.test(prev) && (STARTS_LOWER.test(line) || ENDS_OPEN.test(prev))) {
      out[out.length - 1] = prev.endsWith('-') ? prev + line : `${prev} ${line}`;
    } else {
      out.push(line);
    }
  }
  return out;
}

/**
 * Builds the editable text and a page map from captured pages.
 * @param {Array<{page:number, items:Array}>} pages
 * @param {{maxChars?:number}} options
 * @returns {{text:string, pages:number[], lineCount:number, emptyPages:number, truncated:boolean, truncatedAtPage:number|null}}
 */
export function linesFromPages(pages, { maxChars = DEFAULT_MAX_CHARS } = {}) {
  const textLines = [];
  const pageStarts = [];
  let emptyPages = 0;
  let truncated = false;
  let truncatedAtPage = null;
  let chars = 0;
  outer: for (const { page, items } of pages || []) {
    let lines = reflow(paragraphsFromLines(linesFromItems(items)));
    if (!lines.some(Boolean)) {
      emptyPages += 1;
      lines = [`[PDF page ${page}: no text layer]`];
    }
    if (textLines.length && textLines[textLines.length - 1] !== '') {
      textLines.push('');
      chars += 1;
    }
    pageStarts.push(textLines.length + 1);
    for (const line of lines) {
      if (chars + line.length + 1 > maxChars) {
        truncated = true;
        truncatedAtPage = page;
        break outer;
      }
      textLines.push(line);
      chars += line.length + 1;
    }
  }
  while (textLines.length && textLines[textLines.length - 1] === '') textLines.pop();
  // A page that lost every line to truncation has no start inside the text.
  const starts = pageStarts.filter((start) => start <= textLines.length);
  return { text: textLines.join('\n'), pages: starts, lineCount: textLines.length, emptyPages, truncated, truncatedAtPage };
}

/**
 * Returns the 1-based page that contains a 1-based line, or null without a page map.
 * @param {number[]} pageStarts
 * @param {number} line
 */
export function pageOfLine(pageStarts, line) {
  if (!Array.isArray(pageStarts) || !pageStarts.length || !Number.isInteger(line) || line < 1) return null;
  let page = 0;
  for (const start of pageStarts) {
    if (start <= line) page += 1;
    else break;
  }
  return page || null;
}

/**
 * Reads a PDF file in the browser and returns its text layer as lines with a page map.
 * The pdf.js build is loaded only when needed; the worker runs in this browser.
 * @param {File} file
 * @param {{maxChars?:number, maxBytes?:number, maxPages?:number}} options
 */
export async function readPdfFile(file, { maxChars = DEFAULT_MAX_CHARS, maxBytes = DEFAULT_MAX_BYTES, maxPages = DEFAULT_MAX_PAGES } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new PdfError('notPdf');
  const looksPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!looksPdf) throw new PdfError('notPdf');
  if (file.size > maxBytes) throw new PdfError('tooLarge');

  const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: false, disableAutoFetch: true, verbosity: 0 });
  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (error) {
    throw new PdfError(error && error.name === 'PasswordException' ? 'protected' : 'unreadable');
  }
  try {
    const pagesRead = Math.min(doc.numPages, maxPages);
    const pages = [];
    for (let number = 1; number <= pagesRead; number++) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      const items = content.items
        .filter((item) => typeof item.str === 'string')
        .map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5], w: item.width, h: item.height, eol: Boolean(item.hasEOL) }));
      pages.push({ page: number, items });
      if (typeof page.cleanup === 'function') page.cleanup();
    }
    const result = linesFromPages(pages, { maxChars });
    if (result.emptyPages === pagesRead) throw new PdfError('noText');
    return { ...result, pageCount: doc.numPages, pagesRead, name: file.name || 'document.pdf' };
  } catch (error) {
    if (error instanceof PdfError) throw error;
    throw new PdfError('unreadable');
  } finally {
    try { await loadingTask.destroy(); } catch { /* nothing else to release */ }
  }
}
