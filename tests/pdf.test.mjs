import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { linesFromItems, paragraphsFromLines, reflow, linesFromPages, pageOfLine } from '../src/pdf.mjs';
import { analyse } from '../src/analysis.mjs';
import { detectSignals, findContactEmails, findAmounts } from '../src/insights.mjs';

// Captured from pdf.js 6.5.438 reading tests/fixtures/notice.pdf (a fictional two-page notice).
const fixture = JSON.parse(readFileSync(new URL('./fixtures/notice-items.json', import.meta.url), 'utf8'));

test('rebuilds the wrapped fictional notice into whole sentences with a page map', () => {
  const result = linesFromPages(fixture);
  const lines = result.text.split('\n');
  assert.ok(result.text.includes('Applications close on 4 December 2026 at 17:00 Lisbon time. Late applications will not be accepted.'));
  assert.ok(result.text.includes('Funding: selected projects may receive up to 5,000 EUR to cover project costs. Co-financing: not specified here; check the official notice.'));
  assert.ok(lines.includes('1. Deadline'), 'headings stay on their own line');
  assert.ok(lines.includes('4. Documents'));
  assert.equal(result.pages.length, 2);
  assert.equal(lines[result.pages[1] - 1], '5. Rights', 'page 2 starts at the right line');
  assert.equal(result.emptyPages, 0);
  assert.equal(result.truncated, false);
  assert.equal(result.lineCount, lines.length);
  assert.equal(pageOfLine(result.pages, 1), 1);
  assert.equal(pageOfLine(result.pages, result.lineCount), 2);
  assert.equal(pageOfLine([], 3), null);
});

test('the rebuilt text feeds the analysis without losing dates, amounts, alerts or contacts', () => {
  const { text } = linesFromPages(fixture);
  const { items } = analyse({ text, previousText: '', url: '' });
  const deadline = items.find((item) => item.category === 'deadline' && item.date?.status === 'explicit');
  assert.equal(deadline.date.iso, '2026-12-04');
  assert.ok(items.every((item) => Number.isInteger(item.line) && text.split('\n')[item.line - 1].trim() === item.quote));
  assert.deepEqual(findAmounts(text).map((amount) => amount.raw), ['5,000 EUR']);
  const kinds = new Set(detectSignals(text).map((signal) => signal.kind));
  for (const kind of ['rights', 'payment', 'exclusion', 'match']) assert.ok(kinds.has(kind), kind);
  assert.deepEqual(findContactEmails(text), ['info@example.org']);
});

test('orders items by position, spaces visible gaps and ignores whitespace-only items', () => {
  const items = [
    { str: 'world', x: 60, y: 100, w: 30, h: 10 },
    { str: 'Hello', x: 10, y: 100.5, w: 28, h: 10 },
    { str: ' ', x: 38, y: 100, w: 1, h: 0 },
    { str: 'Second', x: 10, y: 86, w: 40, h: 10 },
    { str: 'line', x: 51, y: 86, w: 20, h: 10 }
  ];
  assert.deepEqual(linesFromItems(items).map((line) => line.text), ['Hello world', 'Second line']);
});

test('keeps paragraphs apart and only re-joins lowercase continuations', () => {
  const lines = [{ text: 'Heading', y: 700 }, { text: 'A sentence that wraps', y: 688 }, { text: 'onto the next line.', y: 676 }, { text: 'co-', y: 664 }, { text: 'financing applies.', y: 652 }, { text: 'Another paragraph starts', y: 620 }, { text: 'here.', y: 608 }];
  const paragraphs = paragraphsFromLines(lines);
  assert.ok(paragraphs.includes(''), 'a larger gap becomes a blank line');
  assert.deepEqual(reflow(paragraphs), ['Heading', 'A sentence that wraps onto the next line.', 'co-financing applies.', '', 'Another paragraph starts here.']);
  assert.deepEqual(reflow(['Prazo', 'a) primeira alínea', 'B) segunda alínea']), ['Prazo a) primeira alínea', 'B) segunda alínea']);
});

test('marks pages without a text layer and truncates at a line boundary', () => {
  const scanned = [{ page: 1, items: fixture[0].items }, { page: 2, items: [] }, { page: 3, items: fixture[1].items }];
  const result = linesFromPages(scanned);
  assert.equal(result.emptyPages, 1);
  assert.ok(result.text.includes('[PDF page 2: no text layer]'));
  assert.equal(result.pages.length, 3);
  assert.equal(pageOfLine(result.pages, result.pages[2]), 3);
  const small = linesFromPages(fixture, { maxChars: 200 });
  assert.equal(small.truncated, true);
  assert.equal(small.truncatedAtPage, 1);
  assert.ok(small.text.length <= 200);
  assert.ok(!small.text.endsWith('\n'));
  assert.deepEqual(small.pages, [1]);
});

test('reads a two-column page column by column', () => {
  const items = [];
  const left = ['As candidaturas devem', 'ser submetidas em', 'português, por via', 'eletrónica, com', 'todos os anexos', 'pedidos no aviso.'];
  const right = ['O júri decide até', 'ao fim do mês.', 'Sem recurso das', 'decisões, que são', 'comunicadas por', 'correio eletrónico.'];
  // Different baselines in each column, as in real two-column notices.
  left.forEach((str, i) => items.push({ str, x: 40, y: 700 - i * 13, w: 120, h: 10 }));
  right.forEach((str, i) => items.push({ str, x: 320, y: 706 - i * 13, w: 120, h: 10 }));
  const text = reflow(paragraphsFromLines(linesFromItems(items))).join('\n');
  assert.equal(text, 'As candidaturas devem ser submetidas em português, por via eletrónica, com todos os anexos pedidos no aviso.\n\nO júri decide até ao fim do mês.\nSem recurso das decisões, que são comunicadas por correio eletrónico.');
  const single = [];
  for (let i = 0; i < 14; i++) single.push({ str: `Linha ${i + 1} de um aviso com texto a toda a largura da página.`, x: 40, y: 700 - i * 13, w: 480, h: 10 });
  assert.equal(linesFromItems(single).length, 14, 'a full-width page is not split');
});

test('joins a line that ends on a preposition even if the next starts with a number', () => {
  assert.deepEqual(reflow(['O prazo termina às 17h00 do dia 30 de março até às', '23h59 do dia 15 de maio de 2026.']), ['O prazo termina às 17h00 do dia 30 de março até às 23h59 do dia 15 de maio de 2026.']);
  assert.deepEqual(reflow(['Applications open from April 6, 2026, until', '11:59 p.m. on May 14, 2026.']), ['Applications open from April 6, 2026, until 11:59 p.m. on May 14, 2026.']);
});
