# Project Guide for AI Coding Agents

## Project
Scalable e-commerce backend built with JavaScript, Node.js, Express.js, MongoDB, Redis-compatible caching, and BullMQ.

## Before making changes
- Inspect package.json, README.md, and relevant source files.
- Confirm the actual project structure and current behavior.
- Identify existing patterns and tests before proposing a design.
- Do not assume documented features are implemented unless verified.

## Engineering rules
- Preserve existing API contracts unless a change is required.
- Follow existing naming, routing, validation, and error-handling conventions.
- Validate input and enforce authentication and authorization.
- Protect order and inventory consistency under concurrency and failures.
- Consider cache invalidation whenever relevant data changes.
- Never log secrets or sensitive user information.
- Avoid unrelated refactoring and unnecessary dependencies.
- Never commit secrets, .env files, credentials, or production data.

## Testing
- Inspect package.json for available test and lint scripts.
- Add or update relevant tests.
- Run tests when the environment supports them.
- Report commands and actual results.
- Never claim unexecuted tests passed.

## Task completion
- Summarize changed files and behavior.
- Explain design decisions and security implications.
- Report tests, failures, and remaining risks.
- Keep changes focused.
- Do not merge or deploy without explicit authorization.