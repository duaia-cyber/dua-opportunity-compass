import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse } from '../src/analysis.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, buildCountdown, explicitDeadlines } from '../src/insights.mjs';

const kinds = (text) => detectSignals(text).map((signal) => signal.kind);

test('flags creative risk clauses in English and Portuguese, quoting the line', () => {
  const text = [
    'Selected works: the artist transfers all rights to the organiser on a perpetual basis.',
    'Os autores cedem os direitos patrimoniais à entidade promotora.',
    'An entry fee of €25 applies to every submission.',
    'Taxa de inscrição: 10 €.',
    'Participation is unpaid.',
    'A participação não é remunerada.',
    'Payment will be made 90 days after delivery.',
    'Late applications will not be accepted.',
    'Works must be unpublished.'
  ].join('\n');
  const signals = detectSignals(text);
  for (const kind of ['rights', 'fee', 'unpaid', 'payment', 'exclusion', 'exclusivity']) assert.ok(kinds(text).includes(kind), kind);
  assert.ok(signals.every((signal) => text.includes(signal.quote)));
  assert.equal(new Set(signals.map((signal) => signal.id)).size, signals.length);
});

test('does not raise risk signals for neutral wording', () => {
  assert.deepEqual(kinds('Open exclusively to residents of Cabo Verde.\nProjects will be assessed by a jury.'), []);
  assert.deepEqual(kinds('A exclusão social é um dos temas.'.replace('exclusão', 'inclusão')), []);
});

test('marks a "not specified" clause instead of presenting it as a firm term', () => {
  const [signal] = detectSignals('Cofinanciamento: não especificado neste exemplo.');
  assert.equal(signal.kind, 'match');
  assert.equal(signal.unspecified, true);
});

test('finds literal amounts across lusophone currencies without converting them', () => {
  const raws = findAmounts('Up to €5,000.\nAté 5.000 € por projeto.\nR$ 20.000 para o Brasil.\n150 000 CVE\nRef 2026 only.').map((amount) => amount.raw);
  assert.deepEqual(raws, ['€5,000', '5.000 €', 'R$ 20.000', '150 000 CVE']);
});

test('reports gaps as not detected, and closes them when the text covers the topic', () => {
  const bare = 'Open call for illustrators.';
  const items = analyse({ text: bare, previousText: '', url: '' }).items;
  assert.deepEqual(findGaps(bare, items), ['deadline', 'amount', 'contact', 'criteria', 'rights']);
  const full = 'Deadline: 4 December 2026.\nGrant up to €3,000, paid within 30 days.\nQuestions: info@example.org\nSelection criteria: originality.\nAuthors keep their copyright.';
  assert.deepEqual(findGaps(full, analyse({ text: full, previousText: '', url: '' }).items), []);
});

test('builds a checklist from literal fragments of document and eligibility lines', () => {
  const text = 'Required documents: CV, portfolio and a budget.\nEligible applicants: artists based in Angola.';
  const checklist = buildChecklist(analyse({ text, previousText: '', url: '' }).items);
  assert.deepEqual(checklist.map((entry) => entry.text), ['CV', 'portfolio', 'a budget', 'Eligible applicants: artists based in Angola.']);
  assert.ok(checklist.every((entry) => entry.quote.includes(entry.text)));
  assert.equal(new Set(checklist.map((entry) => entry.id)).size, checklist.length);
});

test('counts calendar days to an explicit deadline and marks past milestones', () => {
  const countdown = buildCountdown({ iso: '2026-12-04', today: '2026-11-25' });
  assert.equal(countdown.daysLeft, 9);
  assert.deepEqual(countdown.milestones.map((m) => [m.key, m.iso, m.past]), [
    ['gather', '2026-11-13', true], ['draft', '2026-11-20', true], ['budget', '2026-11-27', false], ['review', '2026-12-01', false], ['submit', '2026-12-03', false]
  ]);
  assert.equal(buildCountdown({ iso: '2026-12-04', today: '2026-12-10' }).passed, true);
  assert.equal(buildCountdown({ iso: null, today: '2026-12-10' }), null);
});

test('only explicit deadline dates feed the countdown', () => {
  const text = 'Deadline: 4 December 2026.\nDeadline: 04/12/2026.\nPrazo: 4 de dezembro de 2026.';
  const deadlines = explicitDeadlines(analyse({ text, previousText: '', url: '' }).items);
  assert.deepEqual(deadlines.map((item) => item.date.iso), ['2026-12-04']);
});

test('reports a deadline counted from another date as its own gap', () => {
  const text = 'As inscrições estarão abertas pelo prazo de 45 (quarenta e cinco) dias corridos a contar da data de publicação.';
  const items = analyse({ text, previousText: '', url: '' }).items;
  assert.ok(findGaps(text, items).includes('deadlineRelative'));
  assert.ok(!findGaps(text, items).includes('deadlineDate'));
  const dated = 'Applications close on 4 December 2026. Results within 30 days after the deadline.';
  assert.ok(!findGaps(dated, analyse({ text: dated, previousText: '', url: '' }).items).includes('deadlineRelative'));
});

test('keeps publication and opening dates out of the countdown', () => {
  const text = 'D.O.U. de 13 de agosto de 2025, torna público o edital de seleção das propostas inscritas.\nAs inscrições estarão abertas pelo prazo de 45 dias corridos a contar da data de publicação.';
  const items = analyse({ text, previousText: '', url: '' }).items;
  assert.deepEqual(explicitDeadlines(items), []);
  assert.ok(findGaps(text, items).includes('deadlineRelative'));
});

test('a dated line under a deadline heading becomes a deadline candidate', () => {
  const text = '2. PRAZO e FORMA DE SUBMISSÃO DAS CANDIDATURAS\nOs projetos deverão ser enviados entre 6 de fevereiro até às 23h59 do dia 15 de março.';
  const items = analyse({ text, previousText: '', url: '' }).items;
  const deadline = items.find((item) => item.category === 'deadline' && item.date);
  assert.equal(deadline.line, 2);
  assert.equal(deadline.date.status, 'incomplete');
  assert.deepEqual(findGaps(text, items).filter((gap) => gap.startsWith('deadline')), ['deadlineDate']);
});

test('avoids common false alerts found in real notices', () => {
  const quiet = [
    'a) Para deslocações em Portugal, a comparticipação será de € 500 para artistas individuais.',
    'd) Deixar o local de alojamento cedido desocupado no termo do prazo da cedência;',
    'Este programa tem natureza privada e estritamente voluntária.',
    '4. CAUSAS DE EXCLUSÃO',
    'Artigo 7 - Contrapartidas'
  ].join('\n');
  assert.deepEqual(kinds(quiet), []);
  const real = 'O prémio será pago por transferência bancária no prazo de 60 dias após a conclusão do concurso.\nThe award will be paid by bank transfer within 60 days.\nOs apoios não cobrem a totalidade das despesas da deslocação.';
  assert.deepEqual(kinds(real), ['payment', 'payment', 'match']);
});
