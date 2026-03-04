# Contributing to Codecks MCP Server

Thanks for contributing.

## Development setup
1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Run tests:
   - `npm test`
4. Run lint:
   - `npm run lint`

Required env vars for runtime and integration tests:
- `CODECKS_AUTH_TOKEN`
- `CODECKS_ACCOUNT_SUBDOMAIN`

## Branching model
This repository uses a trunk-based workflow:
- Branch from the default branch (`master`)
- Use short-lived feature branches
- Open a PR and merge via squash

There is no permanent `develop` branch at this time.

## Pull request expectations
- Keep PRs focused and reasonably small
- Include/update tests when behavior changes
- Ensure `build`, `test`, and `lint` pass
- Update docs when tool inputs/outputs change

## MCP compatibility policy
Tool schemas are API contracts for users and clients.

When changing tool inputs/outputs:
- Prefer additive, backward-compatible changes
- Document breaking changes clearly in PR description and release notes
- Update README examples and relevant tests

## Release process
Current release flow is lightweight:
- Merge changes to default branch
- Bump version as needed
- Tag release with a concise changelog summary

## Reporting issues
- Use issue templates for bugs and feature requests
- Include reproduction steps and expected vs actual behavior

