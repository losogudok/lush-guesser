# TASK

Review the code changes on branch `{{BRANCH}}` and improve code clarity, consistency, and maintainability while preserving exact functionality.

# CONTEXT

## Branch diff

!`git diff {{REVIEW_BASE}}...{{BRANCH}}`

## Commits on this branch

!`git log {{REVIEW_BASE}}..{{BRANCH}} --oneline`

# REVIEW PROCESS

Before reviewing, read issue {{TASK_ID}} ({{ISSUE_TITLE}}) and its comments. If new
evidence casts doubt on the issue's validity, necessity, or acceptance criteria,
stop and emit one JSON object wrapped in `<human-required>...</human-required>`
with `decision` (`needs-info` or
`needs-triage`), `reason`, nonempty `evidence`, and a focused `question`. Do not emit
COMPLETE, change issue labels, close the issue, or merge partial work. The runner
will publish the question and pause this pipeline for a human.

1. **Understand the change**: Read the diff and commits above to understand the intent.

2. **Analyze for improvements**: Look for opportunities to:
   - Reduce unnecessary complexity and nesting
   - Eliminate redundant code and abstractions
   - Improve readability through clear variable and function names
   - Consolidate related logic
   - Remove unnecessary comments that describe obvious code
   - Avoid nested ternary operators - prefer switch statements or if/else chains
   - Choose clarity over brevity - explicit code is often better than overly compact code

3. **Check correctness**:
   - Does the implementation match the intent? Are edge cases handled?
   - Are new/changed behaviours covered by tests?
   - Are there unsafe casts, `any` types, or unchecked assumptions?
   - Does the change introduce injection vulnerabilities, credential leaks, or other security issues?

4. **Maintain balance**: Avoid over-simplification that could:
   - Reduce code clarity or maintainability
   - Create overly clever solutions that are hard to understand
   - Combine too many concerns into single functions or components
   - Remove helpful abstractions that improve code organization
   - Make the code harder to debug or extend

5. **Apply project standards**: Follow the coding standards defined in @.sandcastle/CODING_STANDARDS.md

6. **Preserve functionality**: Never change what the code does - only how it does it. All original features, outputs, and behaviors must remain intact.

7. **Use the local strict bar**: Apply the thermo-nuclear review standard from `docs/release-checklist.md`: block structural regressions, avoid ad-hoc branching, keep abstractions direct, and require tests for behavior changes.

# EXECUTION

If you find improvements to make:

1. Make the changes directly on this branch
2. Run the relevant verification commands from `docs/sandcastle.md`
3. Commit describing the refinements

If the code is already clean and well-structured, do nothing.

Once complete, output <promise>COMPLETE</promise>.
