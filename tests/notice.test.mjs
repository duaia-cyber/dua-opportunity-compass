import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse } from '../src/analysis.mjs';
import { explicitDeadlines } from '../src/insights.mjs';
import { noticeCalendar, submissionRules, obligations, rulesChecklist } from '../src/notice.mjs';

const calendar = (text) => noticeCalendar(text, explicitDeadlines(analyse({ text, previousText: '', url: '' }).items));

test('builds the notice calendar by phase, with periods and the countdown deadline', () => {
  const text = [
    'A apresentação de candidaturas decorre de 23 de março a 22 de abril de 2026.',
    'Os esclarecimentos podem ser pedidos até 10 de abril de 2026.',
    'O anúncio dos projetos selecionados será feito a 27 de maio de 2026.',
    'A residência decorrerá entre 1 de julho de 2026 e 31 de julho de 2026.',
    'O pagamento será feito em duas prestações, a segunda a 15 de setembro de 2026.',
    'O relatório final deve ser entregue até 30 de outubro de 2026.'
  ].join('\n');
  const events = calendar(text).map((event) => [event.phase, event.iso, event.endIso]);
  assert.deepEqual(events, [
    ['questions', '2026-04-10', null],
    ['deadline', '2026-04-22', null],
    ['results', '2026-05-27', null],
    ['execution', '2026-07-01', '2026-07-31'],
    ['payment', '2026-09-15', null],
    ['report', '2026-10-30', null]
  ]);
});

test('leaves out legal citations, sign-off lines and dates without a year', () => {
  const text = [
    'Nos termos da Lei n.º 10.406, de 10 de janeiro de 2002, aplica-se o seguinte.',
    'Regulamento (UE) 2016/679 de 27 de abril de 2016 (RGPD).',
    'Campos do Jordão,30 de março de 2026',
    'Cidade da Praia, aos 4 de fevereiro de 2026',
    'Os resultados serão divulgados a 15 de março.',
    'Applications close on 4 December 2026.'
  ].join('\n');
  assert.deepEqual(calendar(text).map((event) => event.iso), ['2026-12-04']);
});

test('reads limits, formats and the application language', () => {
  const text = [
    '(i) CV do(a) candidato(a) em PDF (fonte tamanho 12, máximo 2 páginas);',
    'Biografia resumida (máximo de 300 caracteres com espaços).',
    'Synopsis: no more than 1,000 words.',
    'Os ficheiros não podem exceder 10 MB.',
    'Envie pelo menos 15 imagens em formato JPG ou PNG.',
    'As candidaturas devem ser redigidas em português ou em inglês.',
    'O objetivo é aproximar os países de língua portuguesa.'
  ].join('\n');
  const rules = submissionRules(text).map((rule) => `${rule.kind}:${rule.label}`);
  assert.deepEqual(rules, ['limit:max:2:pages', 'format:PDF', 'limit:max:300:characters', 'limit:max:1000:words', 'limit:max:10:megabytes', 'limit:min:15:images', 'format:JPG,PNG', 'language:pt,en']);
});

test('ignores numbers far from a limit word and languages without a writing verb', () => {
  assert.deepEqual(submissionRules('O júri tem 5 membros e até ao fim do ano publica 3 páginas de notas no site oficial do programa.'), []);
  assert.deepEqual(submissionRules('Programa para os países de língua portuguesa e para quem fala em inglês.'), []);
});

test('finds obligations after selection and classifies them', () => {
  const text = [
    'O vencedor compromete-se a entregar à organização uma obra original no prazo de 30 dias.',
    'A Entidade Beneficiária compromete-se a inserir a menção “Apoio Fundação” em toda a comunicação.',
    'O responsável pelo projecto deve apresentar o relatório no prazo máximo de 45 dias após a conclusão.',
    'Qualquer montante não utilizado deve ser reembolsado ao programa.',
    'A entidade obriga-se a tratar os dados pessoais nos termos do RGPD.',
    'No caso de não residentes em Portugal, deverão ser apresentados documentos equivalentes.',
    'Os candidatos devem preencher o formulário online.'
  ].join('\n');
  assert.deepEqual(obligations(text).map((item) => [item.line, item.kind]), [[1, 'delivery'], [2, 'credit'], [3, 'report'], [4, 'refund']]);
});

test('turns rules into checklist entries with reserved ids', () => {
  const rules = submissionRules('(i) CV em PDF (máximo 2 páginas);');
  const entries = rulesChecklist(rules, (rule) => rule.label);
  assert.deepEqual(entries.map((entry) => entry.id), ['need_1_101', 'need_1_102']);
  assert.ok(entries.every((entry) => entry.kind === 'rule' && /^need_\d{1,6}_\d{1,3}$/.test(entry.id)));
});
