# Devpost project draft

## Project name
DUA Opportunity Compass

## Tagline
A source-linked review workspace for creative opportunities: find candidate deadlines, compare notice versions and prepare the next steps in your browser.

## Inspiration
For creators and small teams, an opportunity can arrive as a long administrative notice. Finding the deadline is only the beginning: rights, payment terms, required documents and obligations can change whether a call is worth pursuing. We wanted to make that reading easier without pretending software can make the decision for someone.

## What it does
Opportunity Compass reads pasted English or Portuguese text and PDFs with a text layer locally in the browser. It highlights candidate dates and clauses beside the lines they came from, proposes questions and a preparation checklist, compares literal changes between versions, and exports a review brief, calendar reference or shortlist. The user confirms a date before exporting it. The example included in the app is fictional.

## How we built it
A framework-free JavaScript application combines the locally bundled pdf.js text extractor, a deterministic pattern-based reading engine, a source-linked interface, an ICS calendar and safe CSV export. The Frankenstein category reflects that combination of document processing, evidence review and practical planning. The input stays in the browser; there is no runtime AI or account integration.

Kiro CLI helped draft the original spec and early modules. Claude Code later built much of the interface and PDF workflow. We subsequently used Kiro on two substantive additions: a spec, tests and implementation for a legal-citation/calendar regression, and a spec, code and tests for tentative topic labels on version changes. We invoked a custom read-only Kiro auditor and observed its save hook run the local tests before and after the calendar fix. Kiro output was reviewed and corrected by the developer; the auditor is not credited with discovering the bug. The `.kiro/` folder documents the specs, steering, agent and hook. No Kiro service is called at runtime.

## Challenges and limits
Notices use inconsistent structures and dates, and PDF reading order can be difficult. We reproduced the recorded deadline outcomes on ten public notices: seven dated candidates, two relative deadlines and one incomplete date. This is a small sample and does not measure recall. The rules may miss or misclassify clauses and dates; a candidate must be checked in the original, and the product makes no eligibility or legal decision. Scanned PDFs without a text layer are not supported.

## Next steps
Explore a future connection with DUA Radar Cultural and evaluate recall on a larger annotated set. The prototype is currently independent and does not access DUA user data.

## Testing instructions
1. Open the public demo, select EN and choose **Try the example**.
2. Read the candidate date and its source. Confirm it only after reviewing the evidence, and inspect the suggested plan and calendar export.
3. Compare versions and filter added or removed lines by topic. These labels are reading prompts, not legal conclusions.
4. Paste a public notice or use the fictional `tests/fixtures/notice.pdf`. A text layer is required.
5. The source repository is MIT licensed and contains `.kiro/`; pdf.js retains its Apache-2.0 licence.

## Links to complete after publication
- Live demo: https://dua-opportunity-compass.vercel.app/
- Public source: https://github.com/duaia-cyber/dua-opportunity-compass
- Public YouTube demonstration under three minutes: pending
