# DUA Opportunity Compass

**See the opportunity. Know what to check next.**

Open calls can hide consequential details across many pages. Opportunity Compass helps creators and small teams review a notice: it highlights candidate deadlines and clauses, keeps findings beside their source lines, compares versions and prepares a working plan. The fictional example makes the workflow easy to try.

This is an independent prototype by [2 LADOS / DUA](https://dua.2lados.pt), not a feature connected to DUA accounts or data.

## Try it

Serve this folder and open the page in a current browser:

```sh
python3 -m http.server 3000 --bind 127.0.0.1
```

Open `http://127.0.0.1:3000/`, choose **EN** or **PT** and select **Try the example**. You can also paste notice text or import a PDF containing a text layer; `tests/fixtures/notice.pdf` is fictional and safe for testing.

## What the prototype does

- Reads pasted English or Portuguese text, or extracts a PDF text layer locally with the bundled pdf.js library.
- Highlights candidate dates, requirements, possible costs, rights and other clauses, with the source line and PDF page when available.
- Shows missing patterns as questions for the organiser, a review checklist and suggested planning milestones. A candidate deadline must be confirmed by the user before exporting its calendar reference.
- Compares added and removed lines between versions and offers tentative topic filters without asserting what a change means.
- Compares a temporary shortlist and exports a calendar, a text brief, a spreadsheet-safe CSV or a local working copy. The browser print command can save a brief as PDF.
- Offers a searchable evidence lens and an English/Portuguese interface.

All notice processing happens in the browser. The static site files are downloaded from the host, but the app does not upload the entered notice or call an AI service. Choosing the DUA link or opening a mail draft is an explicit user action.

## Reliability and limits

The reading engine uses patterns, not legal reasoning. It may miss or misclassify a date, clause or change. A missing alert does not mean that a condition is absent; always check the complete official notice and its time zone. The readiness checklist is not an eligibility decision. Dates and calendar exports are candidates for human verification, not official reminders.

Scanned PDFs without a readable text layer cannot be analysed. Complex layouts, multi-page references, wording and version edits may be reconstructed incorrectly. Added and removed lines are literal differences, not a legal comparison. Downloaded files can contain the user's supplied information and should be handled accordingly.

## Validation

- Run `node --test --test-concurrency=1 tests/*.test.mjs` with Node 20 or later. The latest local run completed **93 tests**. These cover parsing, calendars, version changes, working copies, privacy safeguards and generated examples.
- With the app being served, `/tests/ui.html` runs an automated interface check. The latest local run completed **35 checks**. A separate local browser pass exercised the primary actions, version filtering and layout at widths 320, 360, 390 and 1440 pixels.
- `docs/EVALUATION.md` documents an earlier review of ten public notices. A repeat of the deadline extraction reproduced its recorded outcomes: seven dated candidates, two relative deadlines and one incomplete date. This small sample does not measure recall or establish correctness on other notices; the notices are not redistributed.

## How Kiro contributed

Kiro CLI was used for the original specification and early analysis, calendar and working-copy modules. Claude Code subsequently built much of the PDF, dashboard and reading experience.

On 9 November, Kiro CLI was used again on the actual codebase: it drafted a spec, regression tests and implementation for a calendar edge case involving a legal citation; authored a separate spec, code and tests for topic labels on literal version differences; and added a generated-case regression. Its output was reviewed, corrected and tested by the developer. The Kiro custom auditor was invoked in read-only mode; its suggestions were independently checked. The Kiro save hook ran the local tests and recorded a failing regression before the calendar fix and a passing run afterward. The `.kiro/` directory contains the specs, steering, agent and hook configuration. See [docs/KIRO-EVIDENCE.md](docs/KIRO-EVIDENCE.md) for the scope and limits of these claims.

No Kiro or other AI service is called when using the app. Integration with DUA Radar Cultural is a possible future direction, not a current integration.

## Code and licence

`src/` contains the browser modules; `tests/` contains the tests and fictional fixture; `docs/` explains the evaluation and submission. No build step is required.

The project is MIT licensed; see [LICENSE](LICENSE). The unmodified pdf.js 6.5.438 files in `vendor/pdfjs/` are © Mozilla Foundation and contributors and are licensed under Apache-2.0; the applicable licence is included with the files.
