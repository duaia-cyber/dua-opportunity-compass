# Kiro playbook: historical preparation checklist

**Update, 9 November 2026:** Kiro CLI is installed for the local session; the custom agent and save hook have now been run, and Kiro contributed to the calendar regression and change-review work. See [KIRO-EVIDENCE.md](KIRO-EVIDENCE.md) for what was actually verified. The checklist below records the earlier plan, not the current project status.

The official rules say: *"Entrants must build a working software application using Kiro … Insufficient use of Kiro will result in disqualification at the Judges' sole discretion."* **Technological Implementation** (20% of the score) asks how thoroughly and skilfully Kiro was used: specs, steering, hooks, custom agents, MCP, property-based testing and powers.

**Earlier status, before the Kiro session:**
- Kiro CLI drafted the original spec and the first analysis, calendar and working-copy modules.
- Most later features were built with Claude Code.
- The `.kiro` agent and hook were written to the published Kiro format but **have not yet been run inside Kiro**.
- Kiro is not installed on the machine used for this session.

The steps below are concrete, small, and produce real evidence (sessions, diffs, screenshots) before 4 December 2026.

## 1. Run the custom agent (15 minutes)
1. Open the repository in Kiro IDE or Kiro CLI.
2. Start the `notice-auditor` agent (`.kiro/agents/notice-auditor.json`).
3. Ask: *"Audit src/notice.mjs against .kiro/steering/source-of-truth.md. List any rule a function could break, with an input."*
4. Keep the transcript. Fix anything real with Kiro, and record the finding in the write-up.

## 2. Turn the hook on (10 minutes)
1. Check that `.kiro/hooks/opportunity-compass.json` shows up in Kiro's Agent Hooks panel.
2. Edit any module with Kiro and confirm that the test suite runs on save.
3. Take a screenshot of the hook firing.

## 3. Build one feature spec-first with Kiro (1–2 hours)
1. Add a new section to `.kiro/specs/opportunity-compass/requirements.md`. Ask Kiro to generate the design and the tasks.
2. Let Kiro implement it task by task.
3. Good candidates:
   - **Eligibility hints**: a profile (country, individual or collective, age band) chosen by dropdown that highlights the lines mentioning those words, never a verdict;
   - **Version timeline**: compare more than two versions of a notice;
   - **Spanish and Kriol keywords**.
4. Keep the spec, design and tasks files in `.kiro/specs/`.

## 4. Property-based tests from the spec (30 minutes)
1. Ask Kiro to derive properties from the requirements and to extend `tests/properties.test.mjs`.
2. Note any property that found a bug.

## 5. Steering (15 minutes)
Ask Kiro to propose additions to `.kiro/steering/source-of-truth.md` from `docs/EVALUATION.md`. For example: "a period exposes only its closing date". Keep the ones you accept.

## 6. Optional: MCP or powers
If you use an MCP server or a Kiro power, for example to fetch nothing at runtime but to help write tests or docs, record which one and what it enabled.

## 7. Write-up
Fill the "How we used Kiro" section of `docs/SUBMISSION.md` with what actually happened:
- which Kiro app you used;
- what the agent found;
- what the hook prevented;
- how spec-first compared with ad-hoc prompting.

Keep the README section "How Kiro was used" in step with it.
