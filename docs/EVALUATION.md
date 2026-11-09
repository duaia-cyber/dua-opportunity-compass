# Evaluation on real lusophone notices

**Date:** 9 November 2026 · **Engine:** this repository · **Method:** `scripts/evaluate-corpus.mjs`

## Why

The fictional example proves the interface. Real notices show whether the reading rules survive real layouts, Brazilian and Portuguese date styles, two-column PDFs and legal wording. The notices are public documents; they are **not** redistributed here. Only metrics and our own judgement are recorded.

## Corpus (10 public PDFs, 117 pages, about 227,000 characters of text)

| # | Country | Organisation | Call | Pages |
|---|---|---|---|---|
| 1 | Portugal | DGArtes | Programa de Apoio Sustentado 2027–2030, Música e Ópera | 15 |
| 2 | Portugal | Fundação GDA | Apoio a Showcases Internacionais 2026 | 6 |
| 3 | Portugal | CCDR Lisboa e Vale do Tejo | LVT +Cultura 2026 | 7 |
| 4 | Portugal | FLAD | Prémio FLAD de Desenho 2026 (PT + EN) | 4 |
| 5 | Portugal | Fundação CCB | Bolsas de Criação Diogo Seixas Lopes 2026 | 10 |
| 6 | Brazil | Funarte | XVIII Seleção Funarte Marc Ferrez de Fotografia | 22 |
| 7 | Brazil | Prefeitura de Campos do Jordão | Edital PNAB 2026 (Lei Aldir Blanc) | 23 |
| 8 | Cabo Verde | Ministério da Cultura e das Indústrias Criativas | Edital Circula 2/2026 | 5 |
| 9 | Moçambique | Camões – CCP Maputo | Residência Literária Lisboa 2026 | 4 |
| 10 | CPLP | Ibermúsicas | Chamada especial Ibermúsicas–CPLP 2026 | 21 |

Sources were found and checked on 9 November 2026: DGArtes, fundacaogda.pt, ccdr-lvt.pt, flad.pt, ccb.pt, gov.br/funarte, cultura.camposdojordao.sp.gov.br, the Cabo Verde ministry's published Drive link, camoes-ccpmocambique.co.mz and ibermusicas.org.

## Deadline: what the countdown would use

The expected answer was read by a person from each notice.

| # | What the notice says (summarised) | First run | After fixes |
|---|---|---|---|
| 1 | Submission ends 6 Oct 2026, 17:59:59 | no date | **2026-10-06** ✓ |
| 2 | Rolling; at least 30 days before the event | no date | **"deadline counted from another date"** ✓ |
| 3 | From 23 Mar to 22 Apr 2026 | no date | **2026-04-22** ✓ |
| 4 | From 6 Apr until 23:59 on 14 May 2026 | no date | **2026-05-14** ✓ |
| 5 | From 23 Mar to 19 Apr 2026 | no date | **2026-04-19** ✓ |
| 6 | 45 calendar days from publication | no date | **"deadline counted from another date"** ✓ |
| 7 | 30 Mar to 23:59 on 15 May 2026 | no date | **2026-05-15** ✓ |
| 8 | Until 15 March, no year in the sentence | ambiguous | **incomplete date, flagged; no countdown** ✓ |
| 9 | 1 to 28 Feb 2026 | 2026-02-28 ✓ | **2026-02-28** ✓ |
| 10 | 15 Jun to 1 Oct 2026 | no date | **2026-10-01** ✓ |

**First run: 1 of 10 correct. After fixes: 10 of 10 handled correctly** (7 dates, 2 relative deadlines named as such, 1 incomplete date refused).

### What failed, and the rule that fixed it

| Failure seen in real notices | Fix (each has a unit test) |
|---|---|
| Periods ("de 23 de março a 22 de abril de 2026") marked ambiguous | A two-date period joined by *a / até / to / until* exposes its closing date; an opening date without a year is never completed; "between X and Y" stays ambiguous |
| Deadline sentences without the word "prazo" ("A apresentação das candidaturas termina…") | Dated lines about applying, or under a heading such as "Prazo de apresentação das candidaturas", become deadline candidates |
| Opening, publication, execution and jury dates competing with the deadline | A deadline score (submission words, closing words, heading, other-phase words); scores below 1 never feed the countdown |
| Clause numbers ("item 7.1", "5.4") read as day/month | Dotted pairs are no longer treated as dates without a year |
| Sentences broken after "até" / "until" by the PDF | Lines ending on a preposition or conjunction are re-joined |
| Two-column layout mixed line by line (Fundação GDA) | Column gutter detection from horizontal coverage; left column read before right |
| Relative deadlines silently treated as "no date" | New gap: *deadline counted from another date*, with the question to ask |
| Section titles ("1. Deadline", "4. CAUSAS DE EXCLUSÃO") counted as findings | Bare titles skipped for excerpts and alerts |

## Alerts for creative work

After tuning, the engine raised **25 alerts** across the 10 notices. A person read each one:

- **22** point to a clause worth a second read: payment by instalments or after delivery, refund obligations, exchange-rate rules, automatic exclusion, co-financing capacity, rights declarations.
- **2** concern *excluded expenses* rather than excluded applications (CCB 3.4, Circula 4.1). They are useful for the budget but labelled more strongly than they should be.
- **1** is a false positive: "edições de obras inéditas" lists an eligible type of edition, not an exclusivity condition.

False alerts found in the first run and removed: "comparticipação" (the funder's own contribution), "cedência" of accommodation, "programa estritamente voluntário", "contrapartidas" headings.

**Recall was not measured.** Nobody annotated every clause in the corpus, so the share of risky clauses the engine *missed* is unknown. One notice (Campos do Jordão) produced no alert at all, which may be a miss.

## Notice calendar, submission rules and obligations

A second pass on the same 10 notices measured the three newer readers. A person read every result.

| Reader | Found | Judged correct | Notes |
|---|---|---|---|
| Notice calendar (explicit dates by phase) | 23 dates | 22 with the right phase | One line broken by the PDF ("25 de junho de 2026.") was labelled *other* instead of *results*. |
| Submission rules (limits, formats, language) | 32 rules | 27 apply to the application | 5 describe the final product or expense documents (Funarte book and catalogue sizes, CCDR expense PDFs) rather than what to submit. |
| Obligations if selected | 41 clauses | about 34 bind a selected applicant | About 7 are application or process rules (e.g. how to describe a team, how the committee redistributes funds). |

Fixes made during this pass, each with a unit test:

- Laws cited (the RGPD regulation, Lei n.º, Portaria) and sign-off lines ("Cidade da Praia, aos 4 de fevereiro de 2026") are left out of the calendar.
- "reportam" no longer reads as *report*, and "não residentes" no longer reads as a selected applicant.
- "presente regulamento" no longer reads as *present*.
- The funder's own duty to protect personal data is not presented as the artist's obligation.
- Several limits on one line ("2 pages; up to 10 MB") are all read.
- Thousands written with a comma ("1,000 words") are read correctly.
- Every language named next to "written in" counts ("in Portuguese or English").
- A number far from a limit word ("até ao fim do ano publica 3 páginas") is ignored.
- A new *Questions* phase holds the date for clarification requests.

Recall was not measured for these readers either.

## Other observations

- Amounts were quoted in 9 of 10 notices (€, R$, USD). The Cabo Verde call states no amount, and the engine reports that as a gap.
- No page lacked a text layer in this corpus. Scanned PDFs (for example some Goiás PNAB editais) would be reported as "no text layer" and not guessed.
- Word hyphenation across lines ("entre-gues") is kept literally rather than guessed.

## Reproduce

```bash
npm install --no-save pdfjs-dist@6.5.438
node scripts/evaluate-corpus.mjs /path/to/your/pdfs
```

The script prints metrics only. Download the notices yourself from their publishers.
