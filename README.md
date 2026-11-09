# DUA Opportunity Compass

**Read an open call like a careful producer would, before you spend a week applying.**

Creators across the Portuguese-speaking world lose time and money on open calls: a deadline written as a period, a perpetual licence added in the new version, payment that arrives months after delivery, a rule that excludes incomplete files. Opportunity Compass reads the public notice in your browser, shows every finding next to the exact line it came from, and turns it into a plan you can act on.

It is an independent prototype by [2 LADOS / DUA](https://dua.2lados.pt). It runs entirely in the browser, has no AI at runtime, and sends nothing to a server.

## What it does

1. **Import the notice.** Paste the text or drop the PDF. The text layer is read locally with pdf.js; two-column layouts and wrapped sentences are rebuilt, and each finding keeps its PDF page.
2. **Critical reading dashboard.**
   - *Deadline hero and forecast*: days to the deadline, the closing date, and the suggested milestones like a seven-day forecast.
   - *Highlights*: alerts by type (bar chart), preparation gauge, a work-window arc from D−21 to the deadline with today on it, the amount quoted, open questions and the contact found.
   - *Notice map*: every line of the notice as one bar, coloured by what was found, with alert pins and page marks; click to read that line.
   - *Section navigation*: a sticky bar on phones, a side rail on wide screens.
   - *Alerts for creative work*: rights and licences, exclusivity, entry fees, unpaid work, payment timing, grounds for exclusion, co-financing. Clauses that appeared since the earlier version are tagged **New in this version**.
   - *What the text does not say*: missing deadline, amount, contact, criteria, rights or payment timing, and deadlines counted from another date, each with a question for the organiser.
3. **Evidence lens.** The whole notice, line by line and page by page, coloured by what was found. Click a line to jump to its finding, or a finding to jump back to the text.
4. **Plan and kit.**
   - A countdown with suggested working milestones (D−21 to D−1).
   - A readiness checklist split into the documents and conditions the notice asks for.
   - One calendar file with every milestone and the deadline day.
   - An e-mail draft with your questions, opened in your own mail app.
   - A plain-text brief, or print to PDF.
5. **Compare versions** and **save a working copy** (text, notes, review state, checklist, page map) as a local file you can reopen later.

Interface in English and Portuguese; notices in English and Portuguese (PT-PT, PT-BR and African Portuguese usage).

## Run it

JavaScript modules need HTTP, so serve the folder:

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Open `http://127.0.0.1:3000/` and click **Try the example**. The fictional example tells a small story: between two versions, the deadline moved and a perpetual worldwide licence was added.

## Evidence that it works

- **Unit tests**: run `node --test tests/*.test.mjs` with Node 20+. They cover dates, periods, deadline ranking, alerts, gaps, checklist, countdown, calendar files, PDF line rebuilding (using items captured from pdf.js), working copies, and a privacy check that fails if application code gains a network call or a remote script.
- **Real notices**: [docs/EVALUATION.md](docs/EVALUATION.md) records a run over 10 public calls from Portugal, Brazil, Cabo Verde, Moçambique and the CPLP (117 pages).
  - The first run found the right deadline in 1 of 10 notices. After the fixes it documents, all 10 are handled correctly: 7 dates, 2 relative deadlines named as such, and 1 incomplete date that is refused.
  - Of 25 alerts, 22 point to a clause worth reading, 2 are weaker than labelled and 1 is a false positive. Recall was not measured.
- Reproduce the evaluation with `scripts/evaluate-corpus.mjs`. It prints metrics only; the notices are not redistributed.

## Honest limits

- Reading is pattern-based. It can miss or misclassify clauses; every finding is a prompt to read the original, never a legal conclusion or an eligibility decision.
- Dates are never invented. Slash dates such as 04/05/2026 are ambiguous. A period exposes only its explicit closing date. A missing year is never filled in. Publication, opening and results dates never drive the countdown.
- Scanned PDFs without a text layer are reported, not OCR'd.
- Calendar files are all-day references; confirm the time and time zone in the notice.
- DUA integration (for example with Radar Cultural) is a future possibility only. This prototype is not connected to DUA accounts or data.

## Privacy

Text and PDFs are processed in the browser. Nothing is uploaded, stored on a server or tracked. Files you download (brief, calendar, working copy) contain what you supplied; handle them accordingly. The only outbound link is the "Visit DUA" link, followed only when you click it.

## How Kiro was used

- **Kiro CLI** drafted the original specification and developed the first analysis, calendar-export and working-copy modules. That output was inspected and revised after tests exposed date, calendar and validation defects.
- **`.kiro/` is the source of truth**:
  - `specs/opportunity-compass/requirements.md` covers sections 1–12, including the PDF import, evidence lens, application kit, deadline ranking and evaluation.
  - `steering/source-of-truth.md` holds the safety rules every change must respect.
  - `agents/notice-auditor.json` is a read-only auditor agent that checks findings against those rules and runs the tests.
  - `hooks/opportunity-compass.json` runs the full test suite, including the privacy check, whenever the agent saves a module.
- **Claude Code** later added the critical-reading, PDF, evidence-lens and kit modules, the real-notice evaluation, and the matching spec, steering, agent and hook files. The agent and hook follow the Kiro configuration reference as published on kiro.dev on 9 November 2026, but they have not yet been run inside Kiro.
- No Kiro or AI API is called at runtime.

## Project layout

```
index.html, styles.css      interface (EN/PT)
src/analysis.mjs            excerpts, dates, periods, deadline scoring, version diff
src/insights.mjs            alerts, gaps, amounts, checklist, countdown
src/pdf.mjs                 local PDF text layer → lines, columns, page map
src/calendar.mjs            RFC 5545 all-day references and milestone calendars
src/workspace.mjs           local working-copy format (validated)
src/app.mjs                 interface wiring
vendor/pdfjs/               pdf.js 6.5.438 (Apache-2.0), unmodified
tests/                      node:test suites and a captured pdf.js fixture
scripts/evaluate-corpus.mjs metrics-only evaluation over your own PDFs
docs/EVALUATION.md          real-notice evaluation
.kiro/                      spec, steering, agent and hooks
```

## Licence

MIT, see [LICENSE](LICENSE). pdf.js in `vendor/pdfjs` is © Mozilla Foundation and contributors, under the Apache License 2.0.
