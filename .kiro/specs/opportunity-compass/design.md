# Calendar regression: a deadline and a legal citation on one line

## Problem

The calendar used to suppress every line containing a legal-citation marker. For example, `As candidaturas terminam a 4 de dezembro de 2026, nos termos da Lei n.º 20/2020.` lost the candidate application date entirely.

## Conservative rule

On a line containing a legal marker, `noticeCalendar()` considers only the already selected explicit deadline candidate. The line number and ISO date must match, and the end of that exact date must precede the first legal marker. If those checks pass, the calendar emits just that candidate; otherwise it omits the line. Other calendar lines retain the existing handling.

This is a positional heuristic, not a legal interpretation. It deliberately omits a possible deadline after the first marker and cannot prove that a date before the marker is a deadline. Other parts of the prototype can still misclassify a legal date. The original line and context remain the source to check.

## Verification

`tests/notice.test.mjs` exercises the observed deadline-before-law case, a pure legal date, a legal date after a citation marker, incomplete dates and line mismatch. The existing sign-off and phase tests also run. The Kiro save hook captured a failing test before the change and a passing run afterward. These cases are examples, not a proof for all notices.
