import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse } from '../src/analysis.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, explicitDeadlines } from '../src/insights.mjs';
import { textKey, titleFrom, summarize, upsert, sortEntries, toCsv } from '../src/shortlist.mjs';

function analysed(text) {
  const result = analyse({ text, previousText: '', url: '' });
  result.signals = detectSignals(text);
  result.amounts = findAmounts(text);
  result.gaps = findGaps(text, result.items, result.signals, result.amounts);
  result.checklist = buildChecklist(result.items);
  result.deadlines = explicitDeadlines(result.items);
  return result;
}

const callA = 'FICTIONAL EXAMPLE — Residency A\nApplications close on 4 December 2026.\nGrant of up to €3,000, paid within 30 days.\nRequired documents: CV and portfolio.\nSelected works grant the organiser a perpetual licence.';
const callB = 'Prémio B\nAs inscrições estarão abertas pelo prazo de 45 dias corridos a contar da publicação.\nDocumentos necessários: portefólio.';
const callC = 'Bolsa C\nPrazo: 20 de novembro de 2026.\nTaxa de inscrição: 10 €.';

test('titles come from the first line without the fictional prefix, and keys are stable', () => {
  assert.equal(titleFrom(callA), 'Residency A');
  assert.equal(titleFrom('\n\n  Prémio B  \nmore'), 'Prémio B');
  assert.equal(titleFrom('', 'Sem título'), 'Sem título');
  assert.equal(titleFrom('x'.repeat(120)).length, 90);
  assert.equal(textKey(callA), textKey(callA));
  assert.notEqual(textKey(callA), textKey(callB));
});

test('summarises deadline state, amount, alerts, gaps and readiness', () => {
  const a = summarize({ text: callA, analysis: analysed(callA), ready: 1, today: '2026-11-09', example: true });
  assert.equal(a.deadline, '2026-12-04');
  assert.equal(a.deadlineStatus, 'explicit');
  assert.equal(a.daysLeft, 25);
  assert.equal(a.amount, '€3,000');
  assert.ok(a.alerts >= 2);
  assert.equal(a.readiness, 50);
  assert.equal(a.example, true);
  const b = summarize({ text: callB, analysis: analysed(callB), today: '2026-11-09' });
  assert.deepEqual([b.deadline, b.deadlineStatus, b.daysLeft, b.amount], [null, 'relative', null, null]);
});

test('upsert replaces the same call and caps the list', () => {
  const a = summarize({ text: callA, analysis: analysed(callA), today: '2026-11-09' });
  let list = upsert([], a);
  list = upsert(list, { ...a, readiness: 100 });
  assert.equal(list.length, 1);
  assert.equal(list[0].readiness, 100);
  for (let i = 0; i < 40; i++) list = upsert(list, { ...a, key: `k${i}` });
  assert.equal(list.length, 30);
});

test('sorts by soonest deadline, then passed, then undated; and by alerts or readiness', () => {
  const today = '2026-11-25';
  const entries = [callA, callB, callC].map((text) => summarize({ text, analysis: analysed(text), today }));
  assert.deepEqual(sortEntries(entries, 'deadline').map((e) => e.title), ['Residency A', 'Bolsa C', 'Prémio B']);
  assert.equal(sortEntries(entries, 'alerts')[0].title, 'Residency A');
  assert.deepEqual(sortEntries(entries, 'unknown').map((e) => e.title), sortEntries(entries, 'deadline').map((e) => e.title));
});

test('CSV escapes quotes and neutralises spreadsheet formulas', () => {
  const labels = { title: 'Call', deadline: 'Deadline', daysLeft: 'Days', amount: 'Amount', alerts: 'Alerts', gaps: 'Questions', readiness: 'Readiness', example: 'fictional', status: { explicit: '', relative: 'relative', unclear: 'unclear', none: 'not found' } };
  const csv = toCsv([
    { title: '=HYPERLINK("http://x")', deadline: null, deadlineStatus: 'relative', daysLeft: null, amount: '5.000 €', alerts: 1, gaps: 2, readiness: null, example: false },
    { title: 'Bolsa "C", Lisboa', deadline: '2026-11-20', deadlineStatus: 'explicit', daysLeft: -5, amount: null, alerts: 0, gaps: 0, readiness: 50, example: true }
  ], labels);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], 'Call,Deadline,Days,Amount,Alerts,Questions,Readiness');
  assert.ok(lines[1].startsWith(`"'=HYPERLINK(""http://x"")"`));
  assert.ok(lines[1].includes(',relative,'));
  assert.ok(lines[2].startsWith('"Bolsa ""C"", Lisboa (fictional)",2026-11-20,'));
  assert.ok(lines[2].includes(`,'-5,`), 'a negative number is neutralised as text');
});
