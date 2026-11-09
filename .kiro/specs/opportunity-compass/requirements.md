# Opportunity Compass - Requirements

## Overview
Prototype that analyzes public opportunity notices, extracts candidate excerpts, compares versions, and produces a review brief. Human-in-the-loop review only. The user pastes text; no web fetching, server transmission, or DUA integration occurs.

## Core Functions

### 1. Text Input
- Paste public opportunity text in English or Portuguese, or import the PDF of the notice (section 9)
- Optional source URL for reference (not fetched, stored, or transmitted)
- Local in-browser processing only

### 2. Excerpt Extraction
Extracts explicit statements from the supplied text:

- **Deadlines**: A valid ISO date or explicit written month date (e.g., "4 December 2026") may be normalized. Slash and dot numeric dates, multiple dates, incomplete dates and invalid dates are flagged for review; their meaning is not guessed.
  - A dated line about applying or submitting (candidatura, inscrição, submissão, propostas, application, submission), or a dated line directly under a heading such as "Prazo de apresentação das candidaturas", is also a deadline candidate.
  - Exactly two dates joined by *a / até / ao / to / until / through* form a period: its later, explicit date is the closing date (`range: true`). An opening date without a year is never completed. If both dates lack a year the period is `incomplete`. "Between X and Y" stays `ambiguous`.
  - Dotted number pairs ("2.4", "item 7.1") are clause numbers, not dates. Day/month without a year is only recognised in slash form.
  - Short section titles without content ("1. Deadline", "Documentos") are not excerpts.
  - Each deadline candidate carries a score: +2 for submission words, +2 for closing words (termina, encerra, até, prazo, deadline, close, until), +3 under a deadline heading, −2 for other phases (publication, opening, execution, jury, results, payment, report). Only explicit dates with a score of at least 1 feed the countdown, strongest first, then earliest.
- **Eligibility**: Lines containing eligibility-related keywords
- **Documents**: Lines mentioning required documents
- **Costs**: Lines mentioning fees, co-financing, or costs
- **Funding**: Lines mentioning grant or financial support

Each extracted excerpt is anchored to the original source text.

### 3. Evidence Anchoring
- Each item includes the exact quoted line from the input and its 1-based line number
- Date status: `explicit` (valid date found), `ambiguous`, `incomplete`, or `invalid`
- No inference or interpolation of missing values

### 4. Review Workflow
- User marks each extracted excerpt as reviewed (toggles status)
- Status and optional notes are held locally in the current session; the user can download and reopen a working copy.
- No reviewer name or timestamp recorded

### 5. Version Comparison
- User may paste a previous version of the text
- Comparison counts literal added or removed lines and does not compare their order.
- Counts duplicates separately; does not infer legal or rule changes

### 6. Calendar Reference
- For explicit deadline dates marked reviewed, a manually downloadable ICS file is provided
- All-day reference only; the exact time and time zone must be confirmed in the original notice
- Not a scheduled event or reminder

### 7. Export
- Download a plain text brief containing:
  - Source URL (or "Not provided")
  - Example warning (if fictional example loaded)
  - Extracted excerpts with review status
  - Literal text differences (if previous version provided)
  - Countdown, alerts, gaps and readiness checklist (see section 8)
  - Disclaimer: human review required
- The print command can be used to save a PDF through the browser.
- A local JSON working copy can be downloaded and reopened; nothing is uploaded.
- Working copies are version 2 and include checklist progress (`ready`, ids `need_<line>_<n>`) and an optional PDF page map (`pages`, ascending line numbers starting at 1). Version 1 files still open, with an empty checklist; a version 1 file that contains `ready` or `pages` is rejected.

### 8. Critical Reading
A deterministic board shown above the excerpt list. Every element is either a quoted line from the supplied text or an explicit statement that a pattern was not detected. Keywords match at the start of a word, so `cofinanciamento` is not read as `financiamento`.

- **Snapshot**: days from the local calendar day to the earliest explicit deadline date; the first literal currency amount (€, EUR, R$, US$, USD, CVE, AOA, Kz, MZN, GBP and written forms such as euros, reais, escudos, kwanzas, meticais); the number of alert clauses not marked "not specified"; readiness as ticked/total.
- **Alerts for creative work**: lines containing wording about rights and licences, exclusivity, entry fees, unpaid work, payment timing, grounds for exclusion and co-financing (English and Portuguese). Each alert quotes its line and suggests a question. Lines saying a term is "not specified" are tagged as such. Clauses that appear as added lines in the version comparison are tagged "New in this version" and listed first.
- **What the text does not say**: deadline (or explicit deadline date), amount, contact, selection criteria, rights and payment timing that were not detected. Each gap comes with a question for the organiser that the user may copy to the clipboard. A gap means "not detected in the supplied text", never "does not exist".
- **Countdown**: only explicit deadline dates feed it. Suggested working milestones at D−21, D−14, D−7, D−3 and D−1 are labelled as planning aids, not organiser dates; past milestones are marked. If several explicit dates exist, the earliest is used and the user is told to confirm which applies. A passed date is reported as passed. The card shows whether the user reviewed the deadline excerpt.
- **Readiness checklist**: literal fragments of document lines (split on commas, semicolons and "and"/"e") and whole eligibility lines. Ticking an entry tracks preparation only and never states eligibility.
- Amounts are quoted, never converted, summed or interpreted.
- A deadline written relative to another date ("45 dias corridos a contar da publicação", "30 days before") with no dated deadline line produces the gap "deadline counted from another date", with a question asking for the reference date.
- Words with a broad everyday meaning are excluded from alerts when real notices showed false positives: "comparticipação", "contrapartida", "cedência" on its own, "voluntário" on its own. Short titles are not alerts.

### 9. PDF Import
- The user picks or drops a PDF. Its text layer is read in the browser by pdf.js 6.5.438, vendored under `vendor/pdfjs` (Apache-2.0). Nothing is uploaded and no remote script is loaded.
- Text items are grouped into lines by position. A page with a clear empty vertical gutter in the middle is read as two columns, left column first. Larger vertical gaps become blank lines.
- Wrapped sentences are re-joined only when the previous line does not end in sentence punctuation and the next line starts in lowercase, or the previous line ends on a preposition or conjunction. Hyphens are kept literally.
- Pages without a text layer are marked "[PDF page N: no text layer]" and never OCR'd or guessed. A PDF with no text at all, password protection, more than 25 MB or an unreadable structure is refused with a clear message; at most 300 pages and 150,000 characters are kept, and truncation is stated.
- A page map (line where each page starts) lets every excerpt and alert show its PDF page. The map is dropped as soon as the user edits the text so that page numbers can no longer match.

### 10. Evidence Lens
- The full supplied text is shown line by line with line numbers and PDF page separators. Lines with findings are coloured by category; lines with alerts are highlighted.
- Clicking a highlighted line jumps to its finding; every finding has a "Show in text" link back to its line.

### 10b. Dashboard controls
- Alerts chart: dropdown between counts by type and counts by page (or by tenth of the text when there is no PDF page map).
- Plan: dropdown between 2-week (D−10…D−1), 3-week (D−21…D−1) and 6-week (D−42…D−2) suggested plans; the choice drives the timeline, the milestone calendar and the brief.
- Notice map: dropdown filter by alerts or by category; clicking, or pressing Enter on the focused map, opens the lens at the nearest matching line.

### 11. Application Kit
- **Calendar with milestones**: one .ics file with all-day entries for the remaining suggested milestones (labelled SUGGESTED) and the deadline day from the notice. Available only after the user marks the deadline excerpt reviewed, and never for a passed date.
- **E-mail draft**: a `mailto:` link that opens the user's own e-mail app with the questions from the gaps. If exactly one e-mail address appears in the text it is used as recipient; otherwise the recipient is left empty. The page sends nothing.

### 16. Notice Calendar, Submission Rules and Obligations
- **Calendar**: every explicit date (with a year) is placed on a timeline and classified by its line as opening, questions, deadline (the countdown date, and the same date in another sentence about applying), results, project/execution, payment, report or other. Two explicit dates joined by a range word form a period. Sign-off lines and most lines citing laws are left out. A previously selected candidate may be kept on a legal-citation line only when its exact date precedes the first legal marker; see the regression design below. This heuristic can omit or misclassify dates, so check the original notice. Dates without a year are never completed. A dropdown shows all dates or only upcoming ones.
- **Submission rules**: limits on pages, characters, words, minutes, seconds, images, works, files, MB and GB, read only when the number closely follows a limit word (máximo, até, up to, no more than, não pode exceder, mínimo, at least…), with max/min; file formats on lines about files or submission; the application language only when a writing or submitting verb is present, listing every language named. Rules join the readiness checklist with ids need_<line>_101 onwards.
- **Obligations if selected**: lines with an obligation verb and a selected/beneficiary subject, classified as refund, report, credit and publicity, delivery or other commitment. Without a selected subject only refund, report and credit clauses are kept. Data-protection clauses are excluded.
- The brief includes the calendar, the rules and the obligations. All three are prompts to read the line, not legal advice.

### 17. Reading order and review
- The results read in this order: summary (deadline, alerts by type, readiness) → time (notice calendar, plan to the deadline) → content (submission rules or obligations, notice map) → alerts for creative work, beside questions for the organiser and the readiness checklist → shortlist → evidence lens → excerpts and the export panel. The section navigation follows the same order.
- One excerpt per line: a line matched by several categories is shown once with all labels; reviewing it reviews every category of that line. Counts are per line.
- The deadline can be confirmed from the summary card ("Confirm deadline"); this reviews the deadline excerpt and unlocks the calendars. Undoing it locks them again.
- Names are unique per idea: "Questions" is questions for the organiser; the calendar phase for clarification requests is "Clarifications"; the files panel is "Export".

### 18. Property-based tests
- `tests/properties.test.mjs` checks invariants on generated notices: quotes equal their line; no invented dates; slash and year-less dates never normalised; countdown only from explicit dates with a score of at least 1; calendar, amounts, rules, obligations and alerts quote their line; checklist ids unique and accepted by the working copy; plan milestones ordered and correct; CSV free of formula cells; working copies round-trip exactly; PDF re-joining loses no characters.

### 13. Shortlist
- After an analysis the user may add the call to a shortlist kept in memory for this tab only (no browser storage, nothing sent). Re-adding the same text updates its row; at most 30 calls.
- Each row: title (first line of the text, without a fictional-example prefix), deadline or its state (relative, unclear, not found), days left, first amount quoted, number of firm alerts, number of open questions and readiness. Readiness of the current call follows the checklist live.
- A timeline shows every dated call from today to its deadline; undated calls are listed without a bar. A dropdown sorts by soonest deadline, most alerts, most open questions or most ready.
- A CSV can be downloaded for spreadsheets. Cells starting with =, +, - or @ are prefixed with an apostrophe so they cannot run as formulas.

### 14. Lens Search
- A search box in the evidence lens finds text case- and accent-insensitively ("licença" finds "licenca"), highlights every match, shows "current / total" and steps with buttons, Enter and Shift+Enter. Escape clears it.

### 15. Interface Check
- `tests/ui.html` loads the app in a frame and operates every control (dropdowns, map, lens, search, review, notes, calendars, checklist, clipboard, e-mail draft, brief, print, working copy, comparison, shortlist, navigation, PDF import, language). Downloads, clipboard and print are intercepted.

### 12. Evaluation
- `scripts/evaluate-corpus.mjs` runs the engine over a folder of PDFs and prints metrics only. `docs/EVALUATION.md` records a run over 10 public lusophone notices and the fixes it led to. Recall of alerts is not measured.

## Constraints

- No external API calls or web requests
- No cloud storage
- No automatic web scraping or fetching (a test in `tests/privacy.test.mjs` fails if application code gains a network call or a remote script)
- No AI inference at runtime (no eligibility verdicts, no rule interpretation)
- Alerts, gaps and checklist entries are keyword and pattern matches; they may miss or misclassify clauses and are presented as prompts for reading, not legal advice
- Dates: only explicit patterns recognized; no guessing of year/month/day
- Interface input capped at 150,000 characters per text block; working copies at 600,000 bytes
- Excerpts capped at 200; changes capped at 200
- Ambiguous/incomplete dates are flagged, never invented

## Supported Languages

- Interface and labels in English and Portuguese
- Input text in English or Portuguese
- Date extraction supports English and Portuguese month names

## Non-Requirements

- No submission functionality
- No account management, authentication, or user profiles
- No automatic web fetching from URLs
- No integration with DUA systems (current prototype only)
- No scheduled events or automated reminders
- No eligibility determination or advice

## Bug: Deadline lost when line mentions law

When a notice deadline line also cites a law or regulation (e.g., "As candidaturas terminam a 4 de dezembro de 2026, nos termos da Lei n.º 20/2020"), the deadline is excluded from the calendar. The current `noticeCalendar()` filter skips any line matching the `LEGAL_CITE` regex, causing loss of valid explicit deadlines that happen to share a line with legal references.

**Identified case**: "As candidaturas terminam a 4 de dezembro de 2026, nos termos da Lei n.º 20/2020." yields a valid deadline (2026-12-04) but is dropped.

**Algorithm (conservative)**: Keyword proximity or distance from a law is NOT enough to prove a date is a deadline. Only emit a deadline event on a line matching `LEGAL_CITE` if ALL of the following hold:
- The line number equals the already-selected deadline line from `explicitDeadlines()`
- The selected deadline has explicit status and a valid ISO date
- An explicit matching date ends **before** the first `LEGAL_CITE` marker on the line
- Emit only that matching date; suppress the legal-citation line from contributing other dates or phases

Otherwise suppress the legal-citation line entirely. Ordinary lines without `LEGAL_CITE` are unchanged. This deliberately misses candidate deadlines when the citation marker appears before the date. Position and keywords cannot establish the legal meaning of a date, so the user must verify it in the source.

**Constraint**: Preserve the source quote and do not complete an incomplete date. The matcher must omit the tested law-date and ambiguous-date examples, but other phrasings can still be missed or misclassified.

## Future Possibilities

- Integration with DUA accounts or live data would require separate development
- Additional input formats or parsing rules would require updates to the prototype
