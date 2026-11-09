# Kiro contribution and verification

Kiro was used as a development tool, not a runtime service. The public app works without a Kiro account or an AI API key.

## Work performed

- The original project specification and early analysis, calendar-export and working-copy modules were drafted using Kiro CLI. Claude Code then added much of the later PDF, dashboard, notice and evidence-lens experience.
- On 9 November 2026, Kiro CLI was directed to write a spec and regression test for a calendar problem identified during human review: a candidate deadline disappeared when the same line cited a law. The initial test failed. Kiro then drafted a fix; its code and tests required human review and corrections. The final rule is intentionally conservative and is not a guarantee that legal dates are never misclassified.
- Kiro was also directed to create the change-review spec and draft the module, tests and UI for tentative topic labels on added and removed lines. The developer corrected the UI update logic and tightened the tests.
- Kiro drafted a generated-case regression test. The developer subsequently strengthened its assertions.
- The configured `notice-auditor` agent was validated and invoked with read-only tools. Its suggestions were reviewed independently; it is not credited with discovering the calendar issue.
- The configured `PostFileSave` hook ran the test command during a real Kiro session. Local logs retained outside this repository show 74/75 passing before the calendar correction and 75/75 afterward. Later work extended the suite. These results apply to those runs only.

## Reproduce locally

Inspect `.kiro/specs/`, `.kiro/steering/`, `.kiro/agents/` and `.kiro/hooks/`. Run `node --test --test-concurrency=1 tests/*.test.mjs`. The hook requires a compatible Kiro CLI session; its ignored local log is not distributed because it may contain machine-specific information.

Kiro's contribution is substantial, but eligibility and the weight assigned to it are determined by the competition organisers.
