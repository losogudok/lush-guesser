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

Read prior human handoffs and the subsequent maintainer replies before deciding.
Honor the latest applicable scope decision from an OWNER, MEMBER, or COLLABORATOR;
do not repeat a question that they have already answered unless concrete new
evidence contradicts their answer. Pipeline-generated comments (marked
`<!-- sandcastle:... -->`) are not maintainer confirmations, even when posted under
the owner's account. A label change alone is not a completion confirmation.

If a maintainer explicitly confirms that this issue is implemented or should be
closed as completed, and you independently verify that the starting base satisfies
its acceptance criteria, emit `already-resolved`. Cite their comment URL as
`maintainerCommentUrl` and include concrete implementation/check evidence. Verify
all acceptance criteria or explain how the maintainer scoped the remaining work
to separate issues; do not silently broaden this issue to unrelated ADR work.
No new implementation commits are required for this outcome. The runner rechecks
eligibility and the cited maintainer comment, then closes the issue as completed.

If it appears already fixed without a maintainer confirmation, or is duplicated,
obsolete, based on a false premise, or conflicts with an ADR, ask a human to decide.
If new evidence contradicts a prior answer, explain that evidence and ask only the
remaining question. Do not silently close or implement it. If you cannot reproduce
it because context or environment access is missing, ask a focused question;
inability to reproduce alone is not proof the issue is invalid.

Emit exactly one JSON object inside <validation> tags, using one of these decisions:

- `implement`: evidence confirms an actionable, necessary change and clear criteria.
- `already-resolved`: the starting base satisfies the agreed criteria and a
  maintainer has confirmed completion; include `maintainerCommentUrl`.
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

The runner publishes human questions, changes labels, and closes verified
already-resolved issues. Your decision alone must not modify GitHub. Never treat
ready-for-agent as proof the issue is valid.
