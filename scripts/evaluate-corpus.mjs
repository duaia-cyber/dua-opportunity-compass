/**
 * Runs the Opportunity Compass engine over a folder of PDF notices and prints
 * metrics only (never the notice text), so results can be shared without
 * redistributing third-party documents.
 *
 * Usage (Node 20+):
 *   npm install --no-save pdfjs-dist@6.5.438
 *   node scripts/evaluate-corpus.mjs /path/to/folder-with-pdfs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { linesFromPages } from '../src/pdf.mjs';
import { analyse } from '../src/analysis.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, explicitDeadlines, findContactEmails } from '../src/insights.mjs';

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: node scripts/evaluate-corpus.mjs <folder-with-pdfs>');
  process.exit(1);
}
let pdfjs;
try {
  pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch {
  console.error('Install pdf.js for Node first: npm install --no-save pdfjs-dist@6.5.438');
  process.exit(1);
}

const rows = [];
for (const name of readdirSync(folder).filter((file) => file.toLowerCase().endsWith('.pdf')).sort()) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(join(folder, name))), isEvalSupported: false, verbosity: 0 }).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    pages.push({ page: number, items: content.items.filter((item) => typeof item.str === 'string').map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5], w: item.width, h: item.height })) });
  }
  const { text, emptyPages } = linesFromPages(pages);
  const { items } = analyse({ text, previousText: '', url: '' });
  const signals = detectSignals(text);
  const amounts = findAmounts(text);
  const top = explicitDeadlines(items)[0];
  const kinds = {};
  for (const signal of signals) kinds[signal.kind] = (kinds[signal.kind] || 0) + 1;
  rows.push({
    file: name,
    pages: doc.numPages,
    emptyPages,
    characters: text.length,
    candidateExcerpts: items.length,
    countdownDate: top ? top.date.iso : null,
    gaps: findGaps(text, items, signals, amounts),
    alerts: kinds,
    firstAmount: amounts[0]?.raw ?? null,
    checklistEntries: buildChecklist(items).length,
    contactEmails: findContactEmails(text).length
  });
}
console.log(JSON.stringify(rows, null, 2));
