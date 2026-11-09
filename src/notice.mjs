/**
 * Opportunity Compass Notice Module
 * Reads three more things a careful applicant looks for, each quoted from its line:
 * - the notice calendar: explicit dates classified by phase;
 * - submission rules: length and size limits, file formats and language;
 * - obligations that apply if the application is selected.
 * Pattern-based and incomplete by design: every result is a prompt to read the line.
 */

import { findDatesInLine } from './analysis.mjs';
import { startsWordAt } from './insights.mjs';

const has = (text, keywords) => keywords.some((keyword) => startsWordAt(text, keyword));

function lineEntries(text) {
  return String(text || '').split('\n').map((raw, index) => ({ line: index + 1, quote: raw.trim() })).filter((entry) => entry.quote);
}

// ---------------------------------------------------------------- calendar

// Lines that cite laws or sign off a document carry dates that are not part of the call's timeline.
const LEGAL_CITE = /(?<![\p{L}])(lei|leis|decreto|decreto-lei|portaria|despacho|instrução normativa|resolução|regulamento \(ue\)|regulation \(eu\)|directive|diretiva|código civil|d\.o\.u|diário oficial|diário da república|rgpd|gdpr)(?![\p{L}])|n\.?\s?[ºo°]\s?\d/iu;
// "Cidade da Praia, aos 4 de fevereiro de 2026": a place, a comma, then only the date.
const SIGN_OFF = /^[\p{L} .'’-]{2,40},\s*(?:aos\s+|em\s+|on\s+)?\d{1,2}(?:º)?\s+(?:de\s+)?\p{L}+\s+(?:de\s+)?\d{4}\.?$/u;

const PHASES = {
  questions: ['esclarecimento', 'esclarecimentos', 'dúvidas', 'perguntas', 'questions', 'clarification', 'clarifications', 'enquiries', 'inquiries'],
  opening: ['abertura', 'abertas a partir', 'a partir de', 'open from', 'opens on', 'opening of', 'início das candidaturas', 'publicação', 'publicado', 'publication', 'published', 'lançamento'],
  results: ['resultado', 'resultados', 'júri', 'jury', 'decisão', 'decisões', 'decision', 'anúncio', 'announce', 'divulga', 'notifica', 'comunicad', 'homologa', 'results', 'selection will', 'shortlist', 'seleção', 'selecção', 'selecionar', 'avaliação', 'evaluation', 'entrevista', 'entrevistas', 'interview'],
  execution: ['decorrer', 'decorrerá', 'decorre entre', 'realização', 'realizar', 'execução', 'residência', 'residency', 'evento', 'event', 'exposição', 'exhibition', 'festival', 'takes place', 'will take place', 'concretização', 'vigência'],
  payment: ['pagamento', 'pagamentos', 'prestação', 'prestações', 'tranche', 'transferência', 'desembolso', 'liberação dos recursos', 'payment', 'paid', 'instalment', 'installment', 'disbursement'],
  report: ['relatório', 'relatórios', 'prestação de contas', 'final report', 'activity report', 'progress report', 'reports', 'a report']
};
export const PHASE_KEYS = ['opening', 'questions', 'deadline', 'results', 'execution', 'payment', 'report', 'other'];

function phaseOf(lower) {
  for (const phase of ['report', 'payment', 'questions', 'results', 'opening', 'execution']) if (has(lower, PHASES[phase])) return phase;
  return 'other';
}

const SUBMISSION_WORDS = ['candidatura', 'candidaturas', 'inscrição', 'inscrições', 'propostas', 'submissão', 'submeter', 'submetidas', 'applications', 'submissions', 'entries'];

/**
 * Explicit dates in the notice, with the phase their line reads as.
 * The countdown deadline (if any) is marked as the deadline. Dates without a year,
 * ambiguous or invalid dates are left out, never completed.
 * @param {string} text
 * @param {Array} deadlines - explicitDeadlines(items) from insights.mjs
 */
export function noticeCalendar(text, deadlines = []) {
  const deadlineLine = deadlines[0]?.line ?? null;
  const deadlineIso = deadlines[0]?.date?.iso ?? null;
  const events = [];
  const seen = new Set();
  for (const { line, quote } of lineEntries(text)) {
    const explicit = findDatesInLine(quote).filter((date) => date.status === 'explicit' && date.iso);
    if (!explicit.length) continue;
    if (LEGAL_CITE.test(quote) || SIGN_OFF.test(quote)) continue;
    const lower = quote.toLowerCase();
    let phase = phaseOf(lower);
    // A period: two explicit dates joined by a range word.
    let pairs = explicit.map((date) => ({ iso: date.iso, endIso: null, raw: date.raw }));
    if (explicit.length === 2 && explicit[0].iso <= explicit[1].iso && /(?:^|\s)(?:a|até|ao|to|until|through|e|and)(?:\s|$)|[–—-]/iu.test(quote.slice(explicit[0].end, explicit[1].start))) {
      pairs = [{ iso: explicit[0].iso, endIso: explicit[1].iso, raw: quote.slice(explicit[0].start, explicit[1].end) }];
    }
    for (const pair of pairs) {
      // The countdown deadline, and the same date in another sentence about applying (a translated copy, the preamble).
      const sameDate = pair.iso === deadlineIso || pair.endIso === deadlineIso;
      const isDeadline = sameDate && (line === deadlineLine || has(lower, SUBMISSION_WORDS));
      const eventPhase = isDeadline ? 'deadline' : phase;
      const key = `${eventPhase}|${pair.iso}|${pair.endIso || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({ phase: eventPhase, iso: pair.iso, endIso: pair.endIso, raw: pair.raw, line, quote });
    }
  }
  return events.sort((a, b) => a.iso.localeCompare(b.iso) || PHASE_KEYS.indexOf(a.phase) - PHASE_KEYS.indexOf(b.phase)).slice(0, 60);
}

// ------------------------------------------------------------ submission rules

const UNITS = {
  pages: ['páginas', 'página', 'pages', 'page', 'folhas', 'laudas'],
  characters: ['caracteres', 'carateres', 'characters', 'chars'],
  words: ['palavras', 'words'],
  minutes: ['minutos', 'minutes', 'min'],
  seconds: ['segundos', 'seconds'],
  images: ['imagens', 'images', 'fotografias', 'fotos', 'photographs', 'photos'],
  works: ['obras', 'works', 'trabalhos', 'peças', 'pieces', 'faixas', 'tracks', 'temas'],
  files: ['ficheiros', 'arquivos', 'files'],
  megabytes: ['mb', 'megabytes'],
  gigabytes: ['gb', 'gigabytes']
};
const UNIT_WORDS = Object.values(UNITS).flat().sort((a, b) => b.length - a.length).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const LIMIT_CUE = /(?<![\p{L}])(máximo|maximo|max\.?|máx\.?|maximum|até|up to|no more than|not exceed|não (?:pode|podem|deve|devem|poderá|poderão|deverá|deverão) (?:exceder|ultrapassar)|limite|limit|mínimo|minimum|at least|pelo menos|no mínimo)(?![\p{L}])/giu;
// 2.000 / 2,000 / 2 000 are thousands; 1,5 or 2.5 are decimals.
const NUMBER_UNIT = new RegExp(`(?<![\\p{L}\\d.,])(\\d{1,3}(?:[.,\\s ]\\d{3})+|\\d+)(?:[.,](\\d{1,2}))?(?![\\d])(?:\\s*\\([^)]{1,30}\\))?\\s*(${UNIT_WORDS})(?![\\p{L}])`, 'giu');
const FORMATS = ['PDF', 'JPG', 'JPEG', 'PNG', 'TIFF', 'TIF', 'GIF', 'MP4', 'MOV', 'AVI', 'MP3', 'WAV', 'AIFF', 'FLAC', 'DOC', 'DOCX', 'ODT', 'RTF', 'TXT', 'PPT', 'PPTX', 'ZIP', 'EPUB'];
const FORMAT_RE = new RegExp(`(?<![\\p{L}\\d.])\\.?(${FORMATS.join('|')})(?![\\p{L}\\d])`, 'gu');
const FORMAT_CUE = ['formato', 'formatos', 'format', 'formats', 'ficheiro', 'ficheiros', 'arquivo', 'file', 'files', 'enviad', 'submetid', 'submit', 'upload', 'anexo', 'attach', 'em pdf', 'in pdf'];
const LANGUAGE_RE = /(?<![\p{L}])(?:em|in|na|no)\s+(?:(?:língua|idioma|language)\s+)?(português|portuguesa|inglês|inglesa|english|portuguese|espanhol|espanhola|spanish|castelhano|francês|francesa|french|crioulo|kriol)(?![\p{L}])/giu;
const LANGUAGE_NAMES = /(?<![\p{L}])(português|portuguesa|inglês|inglesa|english|portuguese|espanhol|espanhola|spanish|castelhano|francês|francesa|french|crioulo|kriol)(?![\p{L}])/giu;
// The language rule needs a verb about writing or submitting, not just a mention of a language.
const WRITE_CUE = ['redigid', 'escrit', 'apresentad', 'submetid', 'preenchid', 'elaborad', 'written', 'submitted', 'completed', 'drafted'];

function unitOf(word) {
  const lower = word.toLowerCase();
  return Object.keys(UNITS).find((unit) => UNITS[unit].includes(lower)) || null;
}

/**
 * Submission rules quoted from the text: limits (with their unit and whether they are a
 * maximum or a minimum), accepted file formats and the language of the application.
 */
export function submissionRules(text) {
  const rules = [];
  const seen = new Set();
  const add = (rule) => {
    const key = `${rule.kind}|${rule.line}|${rule.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    rules.push(rule);
  };
  for (const { line, quote } of lineEntries(text)) {
    const lower = quote.toLowerCase();
    const cues = [...quote.matchAll(LIMIT_CUE)];
    if (cues.length) {
      for (const match of quote.matchAll(NUMBER_UNIT)) {
        // The number must follow a cue closely ("até 3 páginas", "máximo de 2.000 caracteres").
        const cue = cues.filter((candidate) => candidate.index + candidate[0].length <= match.index).at(-1);
        if (!cue) continue;
        const gap = match.index - (cue.index + cue[0].length);
        if (gap > 12) continue;
        const unit = unitOf(match[3]);
        if (!unit) continue;
        const value = Number(match[1].replace(/[.,\s ]/g, '')) + (match[2] ? Number(`0.${match[2]}`) : 0);
        if (!Number.isFinite(value) || value <= 0) continue;
        const bound = /mínimo|minimo|minimum|at least|pelo menos|no mínimo/iu.test(cue[0]) ? 'min' : 'max';
        add({ kind: 'limit', bound, value, unit, label: `${bound}:${value}:${unit}`, line, quote });
      }
    }
    const formats = [...new Set([...quote.matchAll(FORMAT_RE)].map((match) => match[1].toUpperCase()))];
    if (formats.length && has(lower, FORMAT_CUE)) add({ kind: 'format', formats, label: formats.join(','), line, quote });
    if (has(lower, WRITE_CUE) && quote.match(LANGUAGE_RE)) {
      // Once a "written in <language>" phrase is present, every language named in the line counts ("in Portuguese or English").
      const codes = [...new Set([...quote.matchAll(LANGUAGE_NAMES)].map((match) => {
        const name = match[1].toLowerCase();
        return /portugu/.test(name) ? 'pt' : /ingl|english/.test(name) ? 'en' : /espan|spanish|castel/.test(name) ? 'es' : /franc|french/.test(name) ? 'fr' : 'kea';
      }))];
      if (codes.length) add({ kind: 'language', languages: codes, label: codes.join(','), line, quote });
    }
  }
  return rules.slice(0, 40);
}

// ------------------------------------------------------------------ obligations

const OBLIGATION_MODAL = ['deve', 'devem', 'deverá', 'deverão', 'obriga-se', 'obrigam-se', 'compromete-se', 'comprometem-se', 'é obrigatório', 'são obrigatórios', 'obrigatoriamente', 'fica obrigado', 'ficam obrigados', 'tem de', 'têm de', 'must', 'shall', 'is required to', 'are required to', 'undertake', 'undertakes', 'agree to', 'will be required'];
const AFTER_SELECTION = ['selecionad', 'seleccionad', 'beneficiári', 'beneficiar', 'vencedor', 'premiad', 'apoiad', 'bolseir', 'contemplad', 'selected', 'winner', 'winners', 'awarded', 'grantee', 'recipient', 'beneficiary', 'beneficiaries', 'após a atribuição', 'after the award'];
// Order matters: a refund clause often also mentions delivery or reports.
const OBLIGATION_KINDS = {
  refund: ['devolu', 'restitu', 'reembols', 'repay', 'refund', 'return the'],
  report: ['relatório', 'relatórios', 'final report', 'activity report', 'reports', 'a report', 'prestação de contas', 'prestar contas', 'comprovativ', 'justificativ', 'faturas', 'invoices'],
  credit: ['menção', 'mencionar', 'referência ao apoio', 'logótipo', 'logotipo', 'logo', 'crédito', 'créditos', 'credit', 'acknowledg', 'divulga', 'publicit', 'comunicação', 'imagem institucional'],
  delivery: ['entregar', 'entrega', 'apresentação pública', 'apresentar publicamente', 'exposição', 'concerto', 'espetáculo', 'exemplares', 'cópias', 'deliver', 'exhibit', 'perform', 'present the', 'present their', 'participar', 'participate', 'attend']
};
const DATA_PROTECTION = ['dados pessoais', 'personal data', 'rgpd', 'gdpr', 'proteção de dados', 'data protection'];

/**
 * Obligations that bind a selected applicant: a line with an obligation modal and either a
 * post-selection subject or a typical obligation topic. Classified as report, credit,
 * delivery, refund or other.
 */
export function obligations(text) {
  const result = [];
  for (const { line, quote } of lineEntries(text)) {
    const lower = quote.toLowerCase();
    if (quote.split(/\s+/u).length < 5) continue;
    if (!has(lower, OBLIGATION_MODAL)) continue;
    if (has(lower, DATA_PROTECTION)) continue;
    const kind = Object.keys(OBLIGATION_KINDS).find((key) => has(lower, OBLIGATION_KINDS[key])) || 'other';
    // Without a selected/beneficiary subject only refund, report and credit clauses are kept.
    if (!has(lower, AFTER_SELECTION) && !['refund', 'report', 'credit'].includes(kind)) continue;
    result.push({ id: `obl_${String(line).padStart(4, '0')}`, kind, line, quote });
  }
  return result.slice(0, 40);
}

/**
 * Submission rules as checklist entries, so they can be ticked with the documents.
 * Ids use the reserved range need_<line>_101… to stay apart from document fragments.
 */
export function rulesChecklist(rules, describe) {
  const perLine = new Map();
  return rules.map((rule) => {
    const n = (perLine.get(rule.line) || 0) + 1;
    perLine.set(rule.line, n);
    return { id: `need_${rule.line}_${100 + n}`, kind: 'rule', text: describe(rule), quote: rule.quote };
  });
}
