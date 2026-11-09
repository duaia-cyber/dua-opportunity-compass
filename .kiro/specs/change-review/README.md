# Change review specification

This feature labels added and removed notice lines with possible topics to help a reader find passages worth checking. The labels are tentative and incomplete. A literal line diff does not establish whether a legal obligation changed and does not compare line order.

The implementation uses the existing local analysis and signal readers. A native filter selects all changes or those with detected topics. User text is inserted as text, and no external service or new dependency is used.

- [Requirements](requirements.md)
- [Design](design.md)
- [Tasks](tasks.md)
- Implementation: `src/change-review.mjs` and `src/app.mjs`
- Tests: `tests/change-review.test.mjs` and `tests/ui.html`

Kiro CLI drafted the original spec, code and tests during a spec-first session. The developer reviewed and corrected the UI update logic and tests before the local checks. See `docs/KIRO-EVIDENCE.md` for the contribution and its limits.
