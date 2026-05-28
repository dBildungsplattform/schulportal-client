# GitHub Copilot Code Review Instructions

## Context

- Typescript Frontend using Vue.js.
- Review against the Project Guidelines above.

## Review Rules

- Comment only with high confidence (>80%).
- Be concise and actionable.
- Prefer one issue per comment.
- Ignore mere clarity/style nits unless they can cause errors.

## Priorities

- Security: command injection, path traversal, missing external input validation, sensitive error leaks.
- Correctness: logic errors, resource leaks, boundary/off-by-one bugs, risky defaults.

## CI Awareness

- Reviews happen before CI; do not report issues CI already catches (formatting, TS compile errors, outdated deps, build/test failures).

## Low-Value Feedback to Skip

- Style/formatting, missing deps, failing tests.
- Minor naming tweaks.
- "Add comments" suggestions for self-documenting code.
- Non-critical refactors.
- Logging suggestions unless required for error/security handling.

## Comment Format

When reporting an issue:

1. Problem (1 sentence)
2. Why it matters (if not obvious)
3. Concrete fix (snippet or specific action)

## Silence Rule

- If uncertain, do not comment.
