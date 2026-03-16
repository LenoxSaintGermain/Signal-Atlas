Use the local Orbital bridge for testing and verification.

First read:

- `.context/orbital-agent/README.md`
- `.context/orbital-agent/skills/webapp-testing/SKILL.md`
- `.context/orbital-agent/skills/verification-before-completion/SKILL.md`
- `.context/orbital-agent/workflows/implement-tdd.md`

Then choose the most appropriate verification path for the current task and run it.

Rules:

- prefer direct verification over assumption
- use browser-level checks when the issue is UI or interaction-specific
- report exactly what was validated and what was not
