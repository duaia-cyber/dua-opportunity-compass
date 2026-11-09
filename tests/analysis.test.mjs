import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse } from '../src/analysis.mjs';

const run = (text, previousText = '', url = '') => analyse({ text, previousText, url });
const deadline = (text) => run(text).items.find((item) => item.category === 'deadline');

test('empty text produces no invented findings', () => {
  const result = run('');
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.changes, []);
});

test('returns literal, grounded excerpts and deterministic distinct IDs', () => {
  const text = '  Eligible applicants must provide required documents: CV.  ';
  const first = run(text).items;
  assert.ok(first.some((item) => item.category === 'eligibility'));
  assert.ok(first.some((item) => item.category === 'documents'));
  assert.ok(first.every((item) => text.includes(item.quote)));
  assert.equal(new Set(first.map((item) => item.id)).size, first.length);
  assert.deepEqual(first, run(text).items);
});

test('identifies explicit English and Portuguese dates within a deadline line', () => {
  const en = deadline('Applications close on 4 December 2026 at 17:00 Lisbon time.');
  const pt = deadline('As candidaturas terminam a 4 de dezembro de 2026 às 17h00.');
  for (const item of [en, pt]) {
    assert.equal(item.date.status, 'explicit');
    assert.equal(item.date.iso, '2026-12-04');
    assert.ok(item.quote.includes(item.date.raw));
  }
});

test('validates leap days and impossible calendar dates without inventing values', () => {
  assert.equal(deadline('Deadline: 2028-02-29').date.iso, '2028-02-29');
  for (const text of ['Deadline: 2026-02-29', 'Deadline: 2026-04-31', 'Deadline: 2026-13-40']) {
    const item = deadline(text);
    assert.equal(item.date.status, 'invalid');
    assert.equal(item.date.iso, null);
  }
});

test('refuses to guess ambiguous and incomplete dates', () => {
  for (const text of ['Deadline: 04/05/2026', 'Applications close between 2 December 2026 and 4 December 2026']) {
    const item = deadline(text);
    assert.equal(item.date.status, 'ambiguous');
    assert.equal(item.date.iso, null);
  }
  assert.equal(deadline('Deadline: 4 December').date.status, 'incomplete');
  assert.equal(deadline('Deadline to be announced.').date, null);
});

test('compares literal lines with duplicates without conflating wording or counts', () => {
  const result = run('Deadline: 4 December 2026\nRepeat\nRepeat', 'Deadline: 20 November 2026\nRepeat');
  assert.deepEqual(result.changes, [
    { kind: 'added', quote: 'Deadline: 4 December 2026' },
    { kind: 'added', quote: 'Repeat' },
    { kind: 'removed', quote: 'Deadline: 20 November 2026' },
  ]);
  assert.deepEqual(run('__proto__\nconstructor', '__proto__\nconstructor').changes, []);
});

test('refuses non-web links and credentials while preserving an ordinary source', () => {
  for (const url of ['javascript:alert(1)', 'https://user:secret@example.com/', 'https://']) {
    assert.throws(() => run('Deadline: 2026-12-04', '', url));
  }
  assert.equal(run('Deadline: 2026-12-04', '', 'https://example.org/rules').sourceUrl, 'https://example.org/rules');
});

test('labels truncation when the review list exceeds its limit', () => {
  const text = Array.from({length: 205}, (_, i) => `Required documents for item ${i}`).join('\n');
  const result = run(text);
  assert.equal(result.items.length, 200);
  assert.equal(result.itemsTruncated, true);
});

test('matches keywords at word start, so co-financing is not also read as funding', () => {
  const categories = (text) => run(text).items.map((item) => item.category);
  assert.deepEqual(categories('Cofinanciamento: não especificado.'), ['costs']);
  assert.deepEqual(categories('Co-financing: not specified.'), ['costs']);
  assert.ok(categories('Financiamento: até 5.000 €.').includes('funding'));
  assert.ok(categories('Ineligible applicants: companies.').includes('eligibility'));
});

test('skips bare section titles but keeps clauses with content', () => {
  const text = '1. Deadline\nApplications close on 4 December 2026.\n4. Documentos necessários\nDocuments: CV.\nPrazo\nPrazo: 4 de dezembro de 2026.';
  const quotes = run(text).items.map((item) => item.quote);
  assert.ok(!quotes.includes('1. Deadline'));
  assert.ok(!quotes.includes('4. Documentos necessários'));
  assert.ok(!quotes.includes('Prazo'));
  assert.ok(quotes.includes('Applications close on 4 December 2026.'));
  assert.ok(quotes.includes('Documents: CV.'));
  assert.ok(quotes.includes('Prazo: 4 de dezembro de 2026.'));
  assert.ok(run('Eligible applicants.').items.length > 0, 'a sentence ending in a full stop is kept');
});

test('reads the closing date of a period without completing the opening date', () => {
  const pt = deadline('A apresentação de candidaturas decorre de 23 de março a 22 de abril de 2026.');
  assert.deepEqual([pt.date.iso, pt.date.status, pt.date.range], ['2026-04-22', 'explicit', true]);
  assert.equal(pt.date.raw, '23 de março a 22 de abril de 2026');
  const en = deadline('Applications may be submitted from 6 April 2026 until 14 May 2026 at 23:59.');
  assert.deepEqual([en.date.iso, en.date.status], ['2026-05-14', 'explicit']);
  const noYear = deadline('As candidaturas são enviadas entre 6 de fevereiro até às 23h59 do dia 15 de março.');
  assert.deepEqual([noYear.date.iso, noYear.date.status], [null, 'incomplete']);
  const reversed = deadline('Deadline: 14 May 2026 or 6 April 2026.');
  assert.equal(reversed.date.status, 'ambiguous');
});

test('finds deadline sentences without the word deadline and ranks them above other dates', async () => {
  const { explicitDeadlines } = await import('../src/insights.mjs');
  const text = [
    'Os projetos não podem começar antes da abertura do concurso (23 de março de 2026), dizem as candidaturas.',
    'K. Prazo de apresentação das candidaturas:',
    'A apresentação das candidaturas termina às 17h59m59s do dia 6 de outubro de 2026.',
    '17. Prazo de concretização',
    'As atividades previstas na candidatura devem decorrer até ao dia 1 de novembro de 2026.'
  ].join('\n');
  const { items } = analyse({ text, previousText: '', url: '' });
  const ranked = explicitDeadlines(items).map((item) => item.date.iso);
  assert.equal(ranked[0], '2026-10-06', 'the closing sentence under the deadline heading wins');
  assert.ok(!ranked.includes('2026-03-23'), 'the opening of the call never feeds the countdown');
});

test('does not read clause numbers as dates', () => {
  const item = deadline('5.4 As candidaturas podem ser apresentadas de 15 de junho a 1 de outubro de 2026.');
  assert.deepEqual([item.date.iso, item.date.status], ['2026-10-01', 'explicit']);
  assert.equal(deadline('2.4 Prazo de inscrição: ver anexo').date, null);
});
