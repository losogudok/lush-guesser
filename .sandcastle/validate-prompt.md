# Validate issue {{TASK_ID}}: {{ISSUE_TITLE}}

Before anyone writes code, determine whether this issue is real, still applies,
and should be solved. Inspect the current code, relevant tests, the issue and its
comments (`gh issue view {{TASK_ID}} --comments`), related issues, `CONTEXT.md`,
relevant ADRs, and `.sandcastle/CODING_STANDARDS.md`.

Compare the issue branch with the starting base `{{REVIEW_BASE}}`. A partial or
completed fix on the issue branch does not prove the base already satisfies it.

This is read-only validation: do not change files, commit, merge, edit GitHub
issues, or close anything. Run existing focused checks where useful; keep any
temporary reproduction outside the repository. Do not include secrets in output.

Check that the issue is still open, unassigned, ready-for-agent, free of conflicting
triage labels, and has no open blockers, including native GitHub dependencies.

For bugs, seek a concrete reproduction, failing existing check, or directly
demonstrated code defect. For features, identify the missing behavior and its
approved acceptance criteria; an approved feature does not need a failing test
before implementation. Cite concrete files, check results, and/or issue comments.

If it is already fixed, duplicated, obsolete, based on a false premise, or conflicts
with an ADR, ask a human to decide. Do not silently close or implement it. If you
cannot reproduce it because context or environment access is missing, ask a focused
question; inability to reproduce alone is not proof the issue is invalid.

Emit exactly one JSON object inside <validation> tags, using one of these decisions:

- `implement`: evidence confirms an actionable, necessary change and clear criteria.
- `needs-info`: evidence or requirements are missing; include a specific `question`.
- `needs-triage`: validity, duplication, priority, or an ADR conflict needs a human
  decision; include a specific `question`.
- `skip`: the issue is now closed, assigned, reclassified, or has an open blocker.
  Do not use skip to hide uncertainty about an otherwise eligible issue.

Every decision requires a nonempty `reason` and at least one concrete `evidence`
entry. For example:

<validation>
{"decision":"needs-info","reason":"The reported behavior depends on an unavailable environment.","evidence":["The issue does not specify which environment exhibits the problem."],"question":"Which environment and reproduction steps show this behavior?"}
</validation>

The runner publishes human questions and changes labels. Your decision alone must
not modify GitHub. Never treat ready-for-agent as proof the issue is valid.
