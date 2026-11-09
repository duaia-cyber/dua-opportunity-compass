# Devpost submission draft (English)

> Draft prepared on 9 November 2026. Nothing here has been submitted. Fields marked **[to confirm]** need a decision or a link from the team before submission (deadline: 4 December 2026, 2:00 pm Pacific Time = 22:00 Lisbon).

## Project name
DUA Opportunity Compass

## Tagline (≤ 200 characters)
Read an open call like a careful producer would: deadline, risks, rules and obligations from any grant or residency notice, each tied to the exact line it came from. In your browser, with no AI guesswork.

## Category
**Frankenstein** **[to confirm]**. The app stitches together parts that do not usually meet:
- a PDF engine (pdf.js) running fully in the browser;
- a deterministic, evidence-anchored reading engine for Portuguese and English legal-administrative text;
- RFC 5545 calendar generation;
- spreadsheet-safe CSV export;
- `mailto:` drafting;
- an evidence-lens interface.

There is no server and no runtime AI.

## Inspiration
Across the Portuguese-speaking world (Portugal, Brazil, Cabo Verde, Angola, Moçambique), artists and small teams depend on public calls. These are long PDFs written in administrative language. The things that hurt are rarely in the summary:
- a deadline written as a period;
- a perpetual licence added in a new version;
- payment arriving months after delivery;
- a rule that excludes incomplete files;
- a report you must deliver 30 days after the project.

We work with these creators every day at 2 LADOS / DUA. Opportunity Compass is the tool we wanted for them.

## What it does
- **Import the notice**: paste text or drop the PDF. The text layer is read locally; two-column layouts and wrapped sentences are rebuilt; every finding keeps its PDF page.
- **Deadline you can trust**: explicit dates only; periods ("from 23 March to 22 April 2026") expose their closing date. Publication, opening and results dates are kept out of the countdown. Missing years, slash dates and "45 days from publication" are flagged, never guessed.
- **Alerts for creative work**: rights and licences, exclusivity, entry fees, unpaid work, payment timing, grounds for exclusion, co-financing. Clauses added since the previous version are tagged *New in this version*.
- **What the text does not say**: missing contact, criteria, rights or payment timing, with questions ready to copy or send from your own mail app.
- **Notice calendar**: every explicit date on one timeline, by phase (opening, clarifications, deadline, results, project, payment, report).
- **Submission rules**: "maximum 2 pages", "300 characters", "10 MB", "PDF", "written in Portuguese". They join a readiness checklist.
- **If selected**: reports, credit and publicity, deliveries and refunds you commit to.
- **Plan**: a 2-, 3- or 6-week plan to the deadline and one calendar file with every milestone.
- **Evidence lens and notice map**: the full text, searchable (accent-insensitive), coloured by finding. Click any finding to see its line.
- **Shortlist**: compare several calls by deadline, alerts, open questions and readiness, and export to CSV.
- **Bilingual**: English and Portuguese interface; reads English and Portuguese notices (PT-PT, PT-BR and African usage).

Nothing is uploaded. There are no accounts and no tracking.

## How we built it
Plain ES modules, no framework, no build step. The modules are:
- `analysis` for excerpts, dates, periods and deadline scoring;
- `insights` for alerts, gaps, amounts, checklist and plans;
- `notice` for the calendar, rules and obligations;
- `pdf` for text-layer reconstruction;
- `calendar`, `shortlist` and `workspace`, all pure and tested.

pdf.js 6.5.438 is vendored (Apache-2.0).

## How we used Kiro **[must be true at submission — see docs/KIRO-PLAYBOOK.md]**
- **Spec-driven development**: `.kiro/specs/opportunity-compass/requirements.md` defines 16 sections, from date rules to the shortlist. It was first drafted with Kiro CLI and grew with every feature.
- **Steering**: `.kiro/steering/source-of-truth.md` holds the non-negotiable rules:
  - never invent a date;
  - never claim eligibility;
  - "not detected" never means "does not exist";
  - nothing leaves the browser.
- **Custom agent**: `.kiro/agents/notice-auditor.json` is a read-only auditor that checks findings against the steering rules and runs the tests.
- **Agent hook**: `.kiro/hooks/opportunity-compass.json` runs the full test suite, including a no-network privacy test, whenever the agent saves a module.
- **Property-based testing**: `tests/properties.test.mjs` generates thousands of notices and checks invariants: no invented date, every quote is a real line, no CSV formula injection, lossless PDF line re-joining.
- **[to complete after using Kiro]** Which Kiro app (IDE / CLI), what the agent caught, what the hook prevented.

## Challenges we ran into
Real notices broke our first version: it found the right deadline in 1 of 10 real lusophone calls. The causes were:
- periods;
- deadlines without the word "deadline";
- clause numbers that look like dates;
- two-column PDFs;
- publication dates competing with the deadline.

After rule-by-rule fixes, each with a test, it handles all 10 (7 dates, 2 relative deadlines named as such, 1 incomplete date refused). The details are in `docs/EVALUATION.md`.

## Accomplishments that we're proud of
- **10/10** deadlines handled correctly on real public notices from Portugal, Brazil, Cabo Verde, Moçambique and the CPLP. The notices are not redistributed; only the metrics are.
- Honest measurement:
  - calendar dates: 22 of 23 with the right phase;
  - submission rules: 27 of 32 apply to the application;
  - obligations: about 34 of 41 bind a selected applicant;
  - recall was not measured.
- **0** network requests, enforced by a test.
- Automated checks:
  - unit and property tests (`node --test tests/*.test.mjs`);
  - a 34-step interface check that operates every control (`/tests/ui.html`);
  - an independent code review whose 11 findings were all fixed and are now covered by tests.

## What we learned
Trust comes from showing the line, not from sounding confident. A good "not detected" is worth more than a wrong answer.

## What's next for DUA Opportunity Compass
- A companion to DUA Radar Cultural, so calls found on the platform open straight into the Compass. This is a future possibility; the Compass is not connected to DUA today.
- More languages and notice formats.
- Measuring recall with annotated notices.

## Links **[to confirm]**
- Live app: **[GitHub Pages or other static host URL]**
- Code: https://github.com/duaia-cyber/dua-opportunity-compass (public; MIT licence; `.kiro` at the root)
- Video (< 3 min, YouTube, public): **[link]**

## Testing instructions for judges
1. Open the live app. No login is needed.
2. Click **Try the example**. Review the dashboard, the notice calendar, the rules and the alerts. The licence clause is tagged *New in this version*.
3. Click **Confirm deadline**, choose a 2-, 3- or 6-week plan, then download the calendar.
4. Drop any public call PDF into the text area, or use `tests/fixtures/notice.pdf` from the repository.
5. Optional: open `/tests/ui.html` on the same host to watch the interface check run.
