/**
 * Property-based tests: hundreds of generated notices, mixing real-looking clauses,
 * dates in many forms, numbers, noise and unicode. Each property is a guarantee the
 * engine must keep for any input, not just for hand-written examples.
 * A seeded generator keeps runs reproducible; set PBT_SEED to explore other inputs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse, findDatesInLine } from '../src/analysis.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, buildCountdown, explicitDeadlines, PLANS } from '../src/insights.mjs';
import { noticeCalendar, submissionRules, obligations, rulesChecklist } from '../src/notice.mjs';
import { toCsv, titleFrom, textKey, sortEntries } from '../src/shortlist.mjs';
import { encodeWorkspace, decodeWorkspace } from '../src/workspace.mjs';
import { reflow } from '../src/pdf.mjs';

const RUNS = 300;
let seed = Number(process.env.PBT_SEED || 20261109);
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (min, max) => min + Math.floor(random() * (max - min + 1));

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function dateText() {
  const day = int(1, 31), month = int(0, 11), year = int(2024, 2028);
  return pick([
    `${day} ${MONTHS_EN[month]} ${year}`,
    `${MONTHS_EN[month]} ${day}, ${year}`,
    `${day} de ${MONTHS_PT[month]} de ${year}`,
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    `${day}/${month + 1}/${year}`,
    `${day}.${month + 1}.${year}`,
    `${day} de ${MONTHS_PT[month]}`,
    `${MONTHS_EN[month]} ${day}`,
    `${day}/${month + 1}`
  ]);
}

const CLAUSES = [
  () => `Applications close on ${dateText()} at 17:00.`,
  () => `As candidaturas decorrem de ${dateText()} a ${dateText()}.`,
  () => `Prazo: ${dateText()}.`,
  () => `Deadline: ${dateText()} or ${dateText()}.`,
  () => `Os resultados serão divulgados a ${dateText()}.`,
  () => `Funding: up to €${int(1, 99)},${int(100, 999)} per project.`,
  () => `Apoio até ${int(1, 99)}.${int(100, 999)} € por projeto.`,
  () => `R$ ${int(1, 900)}.000,00 para o Brasil.`,
  () => `Required documents: ${pick(['CV', 'a portfolio', 'a budget'])}, ${pick(['a letter', 'photos'])} and ${pick(['a video', 'a plan'])}.`,
  () => `Documentos necessários: ${pick(['CV', 'portefólio'])} e ${pick(['orçamento', 'carta'])}.`,
  () => `Eligible applicants: artists based in ${pick(['Portugal', 'Angola', 'Cabo Verde', 'Moçambique'])}.`,
  () => `A descrição não pode exceder ${int(1, 9)} páginas; ficheiros até ${int(1, 50)} MB em ${pick(['PDF', 'JPG', 'MP4'])}.`,
  () => `Synopsis: no more than ${int(1, 3)},${int(100, 999)} words.`,
  () => `As candidaturas devem ser redigidas em ${pick(['português', 'inglês', 'português ou em inglês'])}.`,
  () => `Selected works grant the organiser a ${pick(['perpetual', 'worldwide'])} licence.`,
  () => `O vencedor compromete-se a entregar um relatório final no prazo de ${int(10, 90)} dias.`,
  () => `Any unused amount must be refunded.`,
  () => `Entry fee: ${int(5, 50)} EUR.`,
  () => `Questions: ${pick(['info@example.org', 'apoio@exemplo.pt'])}`,
  () => `Nos termos da Lei n.º ${int(1, 99)}/${int(2000, 2024)}, de ${dateText()}.`,
  () => `Cidade da Praia, aos ${dateText()}`,
  () => `${int(1, 12)}.${int(1, 9)} ${pick(['Prazo de candidatura', 'Elegibilidade', 'Documentos'])}`,
  () => pick(['', '   ', '—', '•', 'ÁÉÍÓÚ ãõç «»', '=SUM(A1:A2)', '<script>alert(1)</script>', 'x'.repeat(int(1, 200))])
];

function notice() {
  return Array.from({ length: int(1, 25) }, () => pick(CLAUSES)()).join('\n');
}

function enriched(text) {
  const result = analyse({ text, previousText: '', url: '' });
  result.signals = detectSignals(text);
  result.amounts = findAmounts(text);
  result.gaps = findGaps(text, result.items, result.signals, result.amounts);
  result.deadlines = explicitDeadlines(result.items);
  return result;
}

const isoParts = (iso) => iso.split('-').map(Number);

test('property: every excerpt quotes its own line exactly', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice();
    const lines = text.split('\n');
    for (const item of analyse({ text, previousText: '', url: '' }).items) {
      assert.equal(item.quote, lines[item.line - 1].trim(), `run ${run}: line ${item.line}`);
    }
  }
});

test('property: no date is invented — every normalised date has its day and year written in the line', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice();
    const lines = text.split('\n');
    for (const item of analyse({ text, previousText: '', url: '' }).items) {
      if (!item.date?.iso) continue;
      assert.equal(item.date.status, 'explicit');
      const [year, , day] = isoParts(item.date.iso);
      const line = lines[item.line - 1];
      assert.ok(line.includes(String(year)), `run ${run}: year ${year} not in "${line}"`);
      assert.ok(new RegExp(`(?<!\\d)0?${day}(?!\\d)`).test(line), `run ${run}: day ${day} not in "${line}"`);
    }
  }
});

test('property: slash, dot and year-less dates are never normalised', () => {
  for (let run = 0; run < RUNS; run++) {
    const day = int(1, 28), month = int(1, 12);
    for (const raw of [`${day}/${month}/2026`, `${day}.${month}.2026`, `${day}/${month}`, `${day} de ${MONTHS_PT[month - 1]}`]) {
      for (const date of findDatesInLine(`Prazo: ${raw}.`)) assert.equal(date.iso, null, raw);
    }
  }
});

test('property: the countdown only uses explicit, positively scored deadlines', () => {
  for (let run = 0; run < RUNS; run++) {
    const { items } = analyse({ text: notice(), previousText: '', url: '' });
    for (const deadline of explicitDeadlines(items)) {
      assert.equal(deadline.date.status, 'explicit');
      assert.ok(deadline.score >= 1, `score ${deadline.score}`);
    }
  }
});

test('property: calendar dates, amounts, rules and obligations all come from their quoted line', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice();
    const lines = text.split('\n').map((line) => line.trim());
    const result = enriched(text);
    for (const event of noticeCalendar(text, result.deadlines)) {
      assert.equal(event.quote, lines[event.line - 1]);
      assert.ok(event.quote.includes(String(isoParts(event.iso)[0])), `calendar year not in "${event.quote}"`);
      if (event.endIso) assert.ok(event.endIso >= event.iso);
    }
    for (const amount of result.amounts) assert.ok(amount.quote.includes(amount.raw));
    for (const rule of submissionRules(text)) {
      assert.equal(rule.quote, lines[rule.line - 1]);
      if (rule.kind === 'limit') assert.ok(rule.value > 0 && /\d/.test(rule.quote));
      if (rule.kind === 'format') assert.ok(rule.formats.every((format) => rule.quote.toUpperCase().includes(format)));
    }
    for (const item of obligations(text)) assert.equal(item.quote, lines[item.line - 1]);
    for (const signal of result.signals) assert.equal(signal.quote, lines[signal.line - 1]);
  }
});

test('property: checklist ids are unique and match the working-copy pattern', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice();
    const { items } = analyse({ text, previousText: '', url: '' });
    const entries = [...buildChecklist(items), ...rulesChecklist(submissionRules(text), (rule) => rule.label)];
    const ids = entries.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length, `run ${run}: duplicate checklist id`);
    for (const id of ids) assert.match(id, /^need_\d{1,6}_\d{1,3}$/);
    if (ids.length) assert.deepEqual(decodeWorkspace(encodeWorkspace({ text, previousText: '', url: '', reviewed: [], notes: {}, ready: ids.slice(0, 200) })).ready, ids.slice(0, 200));
  }
});

test('property: plan milestones are ordered, before the deadline and match their offsets', () => {
  for (let run = 0; run < RUNS; run++) {
    const iso = `20${int(25, 28)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`;
    const today = `20${int(25, 28)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`;
    const plan = pick(Object.keys(PLANS));
    const countdown = buildCountdown({ iso, today, plan });
    const dates = countdown.milestones.map((m) => m.iso);
    assert.deepEqual([...dates].sort(), dates);
    assert.ok(dates.every((date) => date < iso));
    for (const milestone of countdown.milestones) {
      assert.equal(Math.round((Date.parse(iso) - Date.parse(milestone.iso)) / 86400000), milestone.offset);
      assert.equal(milestone.past, milestone.iso < today);
    }
    assert.equal(countdown.passed, iso < today);
  }
});

test('property: CSV never lets a cell start a spreadsheet formula', () => {
  const labels = { title: 'T', deadline: 'D', daysLeft: 'N', amount: 'A', alerts: 'L', gaps: 'G', readiness: 'R', example: 'x', status: { explicit: '', relative: 'r', unclear: 'u', none: 'n' } };
  for (let run = 0; run < RUNS; run++) {
    const entry = { title: pick(['=1+1', '+cmd', '-2', '@x', '\tTab', 'Bolsa "A", B', 'Prémio']) + pick(['', ';', '\n']), deadline: pick([null, '2026-12-04']), deadlineStatus: pick(['explicit', 'relative', 'unclear', 'none']), daysLeft: pick([null, -3, 0, 12]), amount: pick([null, '=HYPERLINK("x")', '€5,000']), alerts: int(0, 9), gaps: int(0, 9), readiness: pick([null, 0, 50, 100]), example: random() < 0.5 };
    const csv = toCsv([entry], labels);
    // Split cells outside quotes and strip surrounding quotes.
    const row = csv.split('\r\n')[1];
    const cells = [];
    let cell = '', quoted = false;
    for (const char of row) {
      if (char === '"') { quoted = !quoted; cell += char; continue; }
      if (char === ',' && !quoted) { cells.push(cell); cell = ''; continue; }
      cell += char;
    }
    cells.push(cell);
    for (const value of cells) {
      const plain = value.startsWith('"') ? value.slice(1) : value;
      if (/^-?\d+$/.test(plain)) continue; // a plain number, such as -3 days left
      assert.ok(!/^[=+\-@\t\r]/.test(plain), `formula cell ${JSON.stringify(value)}`);
    }
  }
});

test('property: working copies round-trip any text exactly', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice() + pick(['', '\u0000', '
', '😀', '"\\']);
    const copy = decodeWorkspace(encodeWorkspace({ text, previousText: notice(), url: '', reviewed: [], notes: {} }));
    assert.equal(copy.text, text);
  }
});

test('property: re-joining PDF lines never loses or invents characters', () => {
  for (let run = 0; run < RUNS; run++) {
    const lines = notice().split('\n').flatMap((line) => line.length > 30 && random() < 0.5 ? [line.slice(0, 20), line.slice(20)] : [line]);
    const strip = (value) => value.replace(/\s+/g, '');
    assert.equal(strip(reflow(lines).join('')), strip(lines.join('')));
  }
});

test('property: shortlist titles are short and keys stable; sorting keeps every entry', () => {
  for (let run = 0; run < RUNS; run++) {
    const text = notice();
    assert.ok(titleFrom(text, 'x').length <= 90);
    assert.equal(textKey(text), textKey(`${text}`));
    const entries = Array.from({ length: int(0, 8) }, (_, i) => ({ key: `k${i}`, title: `T${int(0, 9)}`, daysLeft: pick([null, -5, 0, 3, 40]), alerts: int(0, 5), gaps: int(0, 5), readiness: pick([null, 0, 40, 100]) }));
    for (const by of ['deadline', 'alerts', 'gaps', 'readiness']) {
      const sorted = sortEntries(entries, by);
      assert.equal(sorted.length, entries.length);
      assert.deepEqual(new Set(sorted.map((e) => e.key)), new Set(entries.map((e) => e.key)));
    }
  }
});

test('property: law-citation filter preserves deadlines before Lei n.º markers and rejects dates after', () => {
  for (let run = 0; run < RUNS; run++) {
    const day = int(1, 28);
    const month = int(1, 12);
    const year = int(2025, 2027);
    const expectedIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Test case 1: deadline before law citation
    const textDeadlineBeforeLaw = `As candidaturas terminam a ${day} de ${MONTHS_PT[month - 1]} de ${year}, nos termos da Lei n.º 20/2020.`;
    const resultBefore = enriched(textDeadlineBeforeLaw);
    assert.ok(resultBefore.deadlines[0], `run ${run}: deadline should exist before law marker`);
    assert.equal(resultBefore.deadlines[0].date.iso, expectedIso, `run ${run}: deadline ISO should match exact date`);

    const eventsBefore = noticeCalendar(textDeadlineBeforeLaw, resultBefore.deadlines);
    const deadlineEventsBefore = eventsBefore.filter((e) => e.iso === expectedIso);
    assert.equal(deadlineEventsBefore.length, 1, `run ${run}: should emit exactly one deadline with expected ISO`);
    assert.equal(deadlineEventsBefore[0].iso, expectedIso);
    assert.equal(deadlineEventsBefore[0].phase, 'deadline');

    // Test case 2: same date after Lei n.º 20/2020 with explicit date passed
    const textDateAfterLaw = `Conforme Lei n.º 20/2020, de ${day} de ${MONTHS_PT[month - 1]} de ${year}.`;
    const eventsAfter = noticeCalendar(textDateAfterLaw, [{ line: 1, date: { iso: expectedIso, status: 'explicit' } }]);
    assert.deepEqual(eventsAfter, [], `run ${run}: should emit no events when date appears after Lei n.º marker`);
  }
});
