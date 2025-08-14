# Contributing to Nodey

Thank you for your interest in contributing! This project welcomes bug reports, fixes, features, documentation, and ideas.

By participating in this project, you agree to abide by our Code of Conduct and Security Policy.

- Code of Conduct: CODE_OF_CONDUCT.md
- Security Policy: SECURITY.md

## Getting Started

1. Fork the repository and create a branch:
   - git checkout -b feat/your-feature-name
2. Install and run:
   - npm install
   - npm run dev
3. Run checks before opening a PR:
   - npm run typecheck
   - npm run lint
   - npm test
   - npm run build

## Development Guidelines

- Use TypeScript with explicit types for exported/public APIs; avoid any.
- Prefer small, focused components and functions; handle errors explicitly.
- Keep UI consistent with Tailwind and components in components/ui.
- State lives in hooks/use-workflow-store.ts; keep updates pure and predictable.
- For React Flow, avoid deep prop drilling; encapsulate node UI under components/workflow.
- Accessibility: semantic elements, labels, keyboard interactions where applicable.

## Commit Messages (Conventional Commits)

Examples:
- feat(editor): add email node body field
- fix(flow): prevent delete on configure click
- docs: add contribution guide
- refactor(ui): simplify toolbar buttons

Common types: feat, fix, docs, refactor, chore, test, perf, build.

## Pull Requests

- Keep PRs focused and small where possible.
- Describe the problem and solution clearly; include screenshots/gifs for UI changes.
- Ensure all checks pass before requesting review.
- Link issues (e.g., Closes #123) when applicable.

## Adding Features

- Discuss larger proposals first via an issue.
- When adding new nodes/actions, update types in types/workflow.ts, server logic under server/services, and UI under components/workflow.
- Update docs in docs/ and README.md as needed.

## Reporting Bugs

- Use the Bug Report issue template. Include reproduction steps, expected vs actual behavior, and environment details.

## Security

- Do not file public issues for vulnerabilities. See SECURITY.md for private reporting instructions.

## License

By contributing, you agree that your contributions are licensed under the project LICENSE.
