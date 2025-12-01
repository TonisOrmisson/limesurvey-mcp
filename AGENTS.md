# Repository Guidelines

## Project Structure & Modules
- `src/index.ts` boots the MCP server and hands off to `src/server.ts`.
- `src/server.ts` wires transports (stdio + SSE on `PORT`, default 3000), registers tools, honors `READONLY_MODE=true` to skip write modules.
- Tools: `src/tools/` (surveys, questions, statistics, participants, responses, survey-management, quotas, languages). HTTP client: `src/services/limesurvey-api.ts`. Logging: `src/utils/logger.ts`.
- Quota tools (`src/tools/quotas.ts`): `addQuota`, `setQuotaProperties`, `deleteQuota` (write; excluded when `READONLY_MODE=true`).
- Language tools (`src/tools/languages.ts`): `addSurveyLanguage`, `deleteSurveyLanguage`, `setSurveyLanguageProperties` (write; excluded when `READONLY_MODE=true`).
- Build output in `dist/`; runtime logs in `logs/`; secrets/config in `.env` (untracked).

## Build, Test, and Development Commands
- `npm install` to sync deps.
- `npm run build` compiles TypeScript to `dist/`.
- `npm start` runs the compiled server (stdio + HTTP/SSE).
- `npm run dev` rebuilds + restarts on file changes (nodemon); slower cycle.
- `npm run sync` pins the MCP SDK to 1.9.0.
- Docker: `docker-compose up --build` maps `${PORT:-3000}:3000` and persists `logs/` via volume.
- Tests: `npm test` currently exits with an error; add real tests before wiring CI.

## Coding Style & Naming Conventions
- TypeScript + ES modules; prefer `async/await`, `const`/`let`, and explicit types over `any`.
- Indent 2 spaces; order imports external → internal.
- Use `logger` (JSON + colorized console) for operational output; pass context objects.
- Keep one tool per file in `src/tools/`, mirroring LimeSurvey domains.
- For every new tool and client wrapper you add, you MUST:
  - Confirm that the corresponding LimeSurvey RemoteControl2 API method exists and matches the expected signature by checking BOTH:
    - The official RemoteControl2 documentation, and
    - The local source file `LIME/remotecontrol_handle.php` in this repo (treat this file as the source of truth for the actual instance).
  - Validate all input parameters and types with `zod` schemas (no “pass‑through” unvalidated payloads), keeping names and semantics aligned with the PHP method signatures.

## Testing Guidelines
- Stub LimeSurvey API calls; do not hit real endpoints or store credentials.
- Name specs after tool actions (e.g., `surveys.listSurveys.spec.ts`).
- Cover error paths: expired session keys, missing params, logging branches.

## Commit & Pull Request Guidelines
- Match current history: short, imperative summaries (~72 chars, e.g., “fix not existing endpoint”).
- PRs: state intent, bullet key changes, and include verify steps (`npm run build`, sample `curl http://localhost:3000/sse`).
- Call out new env vars (`READONLY_MODE`, LimeSurvey credentials) or migrations; link issues.
- Attach logs/screenshots only when they clarify behavior.

## Security & Configuration Tips
- Env vars: `LIMESURVEY_API_URL`, `LIMESURVEY_USERNAME`, `LIMESURVEY_PASSWORD`; optional `PORT`, `READONLY_MODE`.
- Do not commit `.env` or secrets; update `.env.example` when adding settings.
- Set `READONLY_MODE=true` to disable write tools (participants/responses/survey-management/quotas/languages).
