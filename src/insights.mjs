/**
 * Opportunity Compass Insights Module
 * Deterministic, evidence-anchored reading aids for creative people:
 * risk signals, gaps in the notice, a readiness checklist and a deadline countdown.
 * Every signal quotes the supplied line it came from. Gaps only state that a
 * pattern was not detected in the supplied text; they never claim the rule does not exist.
 */

// Keywords match at the start of a word (see startsWordAt), in English and Portuguese.
const SIGNALS = {
  rights: ['all rights', 'transfer of rights', 'transfer the rights', 'assign the rights', 'assignment of rights', 'copyright', 'intellectual property', 'royalty-free', 'perpetual', 'irrevocable', 'worldwide licen', 'cedência de direitos', 'cedência dos direitos', 'ceder os direitos', 'cede os direitos', 'cedem os direitos', 'direitos cedidos', 'direitos de autor', 'direitos patrimoniais', 'propriedade intelectual', 'perpétu', 'irrevogáv', 'isenta de royalties', 'isento de royalties'],
  exclusivity: ['exclusivity', 'exclusive right', 'exclusive licen', 'on an exclusive basis', 'not previously published', 'unpublished', 'exclusividade', 'em exclusivo', 'regime de exclusividade', 'inédit'],
  fee: ['entry fee', 'application fee', 'submission fee', 'registration fee', 'participation fee', 'taxa de inscrição', 'taxa de candidatura', 'taxa de participação', 'valor de inscrição', 'custo de inscrição'],
  // "Voluntário" alone is left out: notices use it for volunteer staff or a "voluntary programme".
  unpaid: ['unpaid', 'no fee will be paid', 'without pay', 'without remuneration', 'unremunerated', 'for exposure', 'pro bono', 'sem remuneração', 'não remunerad', 'não é remunerad', 'não será remunerad', 'não há lugar a remuneração', 'a título gracioso', 'em troca de visibilidade'],
  payment: ['payment will be', 'paid after', 'payment after', 'paid within', 'payment within', 'paid upon', 'payment upon', 'will be paid', 'is paid', 'are paid', 'bank transfer', 'instalment', 'installment', 'reimburse', 'pagamento será', 'pagamento após', 'pago após', 'pagos após', 'pagamento em', 'será pago', 'serão pagos', 'é pago', 'são pagos', 'pagamentos são', 'pagamento do montante', 'pagamento do apoio', 'pagamentos do apoio', 'pagamento do prémio', 'período de pagamento', 'transferência bancária', 'prestações', 'reembolso', 'tranche'],
  exclusion: ['will be excluded', 'disqualif', 'will not be accepted', 'will not be considered', 'automatically rejected', 'excluíd', 'exclusão', 'não serão aceites', 'não será aceite', 'desqualifica', 'não serão consideradas', 'não será considerada'],
  // "Comparticipação" and "contrapartida" are left out: notices use them for the funder's own support or obligations.
  match: ['co-financing', 'cofinancing', 'match funding', 'matching funds', 'own contribution', 'does not cover the full', 'cofinanciamento', 'capitais próprios', 'totalidade das despesas', 'totalidade dos custos', 'financiamento próprio']
};

export const SIGNAL_KINDS = Object.keys(SIGNALS);

// Kinds where a "not specified here" style line should not be presented as a firm risk.
const NEGATED = /\b(not specified|not stated|não especificad|não indicad|não definid|a definir|to be confirmed)/iu;

const CURRENCY = '(?:€|EUR|R\\$|US\\$|USD|CVE|AOA|Kz|MZN|GBP|£)';
const CURRENCY_WORD = '(?:€|EUR|euros?|reais|USD|dólares|CVE|escudos|AOA|kwanzas|MZN|meticais|GBP)';
const NUMBER = '\\d(?:[\\d.,]|[ \\u00a0](?=\\d{3}(?!\\d)))*';
const AMOUNT = new RegExp(`${CURRENCY}\\s?${NUMBER}|(?<![\\p{L}\\d])${NUMBER}\\s?${CURRENCY_WORD}(?![\\p{L}])`, 'giu');
const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;

const GAP_PATTERNS = {
  contact: ['contact', 'questions', 'enquiries', 'inquiries', 'helpdesk', 'contacto', 'contactos', 'dúvidas', 'esclarecimentos', 'informações adicionais'],
  criteria: ['criteria', 'evaluation', 'assessment', 'jury', 'panel', 'scoring', 'selection process', 'critérios', 'avaliação', 'júri', 'pontuação', 'seleção', 'selecção'],
  rights: ['rights', 'copyright', 'intellectual property', 'licen', 'ownership', 'direitos', 'propriedade intelectual', 'licença', 'autoria']
};

// "45 (quarenta e cinco) dias corridos a contar da publicação", "30 days before the event"
const RELATIVE_DEADLINE = /\d+\s*(?:\([^)]{1,40}\)\s*)?(?:dias|days|business days|working days|semanas|weeks)(?![\p{L}]).{0,40}?(?:corridos|úteis|de antecedência|a contar|após|antes|after|before|from|prior)/iu;

const MILESTONES = [
  { key: 'gather', offset: 21 },
  { key: 'draft', offset: 14 },
  { key: 'budget', offset: 7 },
  { key: 'review', offset: 3 },
  { key: 'submit', offset: 1 }
];

const DAY_MS = 86400000;

export function startsWordAt(text, keyword) {
  let index = text.indexOf(keyword);
  while (index !== -1) {
    if (index === 0 || !/[\p{L}\d]/u.test(text[index - 1])) return true;
    index = text.indexOf(keyword, index + 1);
  }
  return false;
}

function lineEntries(text) {
  return String(text || '').split('\n').map((raw, index) => ({ index, quote: raw.trim() })).filter((line) => line.quote);
}

function hasAny(lower, keywords) {
  return keywords.some((keyword) => startsWordAt(lower, keyword));
}

/** Risk and attention signals for creative work, each anchored to one supplied line. */
export function detectSignals(text) {
  const signals = [];
  for (const { index, quote } of lineEntries(text)) {
    // A short title such as "4. CAUSAS DE EXCLUSÃO" announces a section; the clauses below it are what count.
    if (quote.split(/\s+/u).length <= 6 && !/[.;:,]$/u.test(quote) && !/\d{3,}/u.test(quote)) continue;
    const lower = quote.toLowerCase();
    for (const kind of SIGNAL_KINDS) {
      if (!hasAny(lower, SIGNALS[kind])) continue;
      signals.push({
        id: `sig_${String(index + 1).padStart(4, '0')}_${kind}`,
        kind,
        line: index + 1,
        quote,
        unspecified: NEGATED.test(quote)
      });
    }
  }
  return signals.slice(0, 100);
}

/** Distinct e-mail addresses quoted in the text, in order of appearance (at most five). */
export function findContactEmails(text) {
  const found = [];
  for (const match of String(text || '').matchAll(new RegExp(EMAIL.source, 'gi'))) {
    const email = match[0].replace(/[.,;:)]+$/u, '');
    if (!found.includes(email)) found.push(email);
    if (found.length === 5) break;
  }
  return found;
}

/** Literal currency amounts found in the text. Nothing is converted, summed or interpreted. */
export function findAmounts(text) {
  const amounts = [];
  for (const { quote } of lineEntries(text)) {
    for (const match of quote.matchAll(AMOUNT)) {
      const raw = match[0].trim().replace(/[.,]+$/u, '');
      if (/\d/.test(raw)) amounts.push({ raw, quote });
    }
  }
  return amounts.slice(0, 20);
}

/**
 * Topics the supplied text does not appear to mention.
 * A gap means "not detected here", never "does not exist".
 */
export function findGaps(text, items = [], signals = detectSignals(text), amounts = findAmounts(text)) {
  const lower = String(text || '').toLowerCase();
  const gaps = [];
  const deadlines = items.filter((item) => item.category === 'deadline');
  const hasExplicit = explicitDeadlines(items).length > 0;
  const hasAnyDate = deadlines.some((item) => item.date && (item.score ?? MIN_DEADLINE_SCORE) >= MIN_DEADLINE_SCORE);
  if (!hasExplicit && !hasAnyDate && RELATIVE_DEADLINE.test(text || '')) gaps.push('deadlineRelative');
  else if (!deadlines.length) gaps.push('deadline');
  else if (!hasExplicit) gaps.push('deadlineDate');
  if (!amounts.length) gaps.push('amount');
  if (!EMAIL.test(text || '') && !hasAny(lower, GAP_PATTERNS.contact)) gaps.push('contact');
  if (!hasAny(lower, GAP_PATTERNS.criteria)) gaps.push('criteria');
  if (!signals.some((signal) => signal.kind === 'rights') && !hasAny(lower, GAP_PATTERNS.rights)) gaps.push('rights');
  if (amounts.length && !signals.some((signal) => signal.kind === 'payment')) gaps.push('paymentTiming');
  return gaps;
}

/**
 * Splits document and eligibility lines into a checklist. Each entry text is a
 * literal fragment of its source line, so nothing is invented.
 */
export function buildChecklist(items = []) {
  const entries = [];
  const seen = new Set();
  for (const item of items) {
    if (item.category !== 'documents' && item.category !== 'eligibility') continue;
    const lineMatch = /^item_(\d+)_/.exec(item.id || '');
    const line = lineMatch ? Number(lineMatch[1]) : entries.length + 1;
    const key = `${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const quote = String(item.quote);
    if (item.category === 'eligibility') {
      entries.push({ id: `need_${line}_1`, kind: 'condition', text: quote, quote });
      continue;
    }
    const colon = quote.indexOf(':');
    const body = colon >= 0 ? quote.slice(colon + 1) : quote;
    const parts = body
      .split(/[;,•·]|\s(?:and|e)\s/u)
      .map((part) => part.trim().replace(/[.;:]+$/u, '').trim())
      .filter((part) => part.length > 1);
    const pieces = parts.length ? parts : [quote];
    pieces.slice(0, 12).forEach((text, offset) => {
      entries.push({ id: `need_${line}_${offset + 1}`, kind: 'document', text, quote });
    });
  }
  return entries.slice(0, 60);
}

function parseIsoDay(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isoFromUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Days between "today" and an explicit deadline day, with suggested working
 * milestones counted backwards. Both dates are calendar days; time and time zone
 * remain for the person to confirm in the notice.
 */
export function buildCountdown({ iso, today }) {
  const deadline = parseIsoDay(iso);
  const start = parseIsoDay(today);
  if (deadline === null || start === null) return null;
  const daysLeft = Math.round((deadline - start) / DAY_MS);
  const milestones = MILESTONES.map(({ key, offset }) => {
    const day = deadline - offset * DAY_MS;
    return { key, offset, iso: isoFromUtc(day), past: day < start };
  });
  return { iso, daysLeft, passed: daysLeft < 0, milestones };
}

/**
 * Explicit deadline dates found in the analysis, de-duplicated, strongest deadline
 * wording first (see deadlineScore in analysis.mjs), then earliest date.
 */
// Below this score a dated line reads as another phase (opening, publication, results)
// rather than the application deadline, so it never feeds the countdown.
const MIN_DEADLINE_SCORE = 1;

export function explicitDeadlines(items = []) {
  const candidates = items
    .filter((item) => item.category === 'deadline' && item.date?.status === 'explicit' && item.date.iso && (item.score ?? MIN_DEADLINE_SCORE) >= MIN_DEADLINE_SCORE)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.date.iso.localeCompare(b.date.iso));
  const found = new Map();
  for (const item of candidates) if (!found.has(item.date.iso)) found.set(item.date.iso, item);
  return [...found.values()];
}

export function localIsoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
