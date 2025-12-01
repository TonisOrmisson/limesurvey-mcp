# LimeSurvey MCP Completion Plan

## Goal
Reach full coverage of LimeSurvey RemoteControl2 API with MCP tools, starting with partially implemented areas.

## Workstream 1 — Finish Existing Service Coverage
- [x] **Survey lifecycle tools**: implement `add_survey`, `copy_survey`, `delete_survey`, `import_survey`, `export_survey`, `activate_tokens` in `src/tools/survey-management.ts` using existing client methods (`importSurvey`, `exportSurveyStructure`, `copySurvey`, `deleteSurvey`, `activateSurvey`, plus `activate_tokens`).
- [x] **Response CRUD tools**: add tools for documented RC2 endpoints: `add_response`, `update_response`, `delete_response`, `export_responses_by_token`, `export_timeline`, `get_response_ids` (use existing `export_responses` for querying data; avoid undocumented names like `get_response`, `delete_all_responses`, `set_response_status`, `import_responses`).
- [x] **Uploads**: expose `upload_file` and `get_uploaded_files` as tools.
- [x] **Questionnaire/field map**: add tool for `get_fieldmap` (no `get_questionnaire*` method exists in RemoteControl2; document that in README/AGENTS instead of inventing one).

## Workstream 2 — Structure & Question Management
- [x] **Group/question CRUD**: add tools only for group/question methods that are confirmed in your LimeSurvey RC2 version (e.g. `import_group`, `export_group`, `set_group_properties`, `get_group_properties`); do not reference `add_group` / `import_question` / `delete_question` unless verified.
- [x] **Properties setters**: add `set_survey_properties` tool only if it exists in RC2; otherwise document its absence instead of inventing it.

## Workstream 3 — Participants & Communications
- [x] **Email flows**: add tools for `invite_participants` / `remind_participants` only if present in your RC2 instance; skip or document anything not backed by the API.

## Workstream 4 — Quotas & Languages
- [x] **Quotas**: add tools for quota methods that exist in RC2 (e.g. `get_quota`, `set_quota_properties`, `add_quota`, `delete_quota`), skipping non‑existent names such as `list_quotas`.
- [x] **Languages**: add tools for `add_language`, `delete_language`, `set_language_properties` only after confirming they are available in the LimeSurvey docs/instance.

## Workstream 5 — Admin/Site Utilities
- [x] **Site settings**: continue exposing `get_site_settings` with safe filters; only add `get_available_site_settings` if it exists in your version.
- [x] **User/org info**: add tools for `get_user_details` (client wrapper already exists) and any other user/list methods that are present in RC2; avoid planning `list_users` / `list_survey_groups` unless verified.

## Cross-Cutting
- [x] **Service client gaps**: add missing client wrappers for RC2 endpoints above; keep signatures close to API, with sensible defaults.
- [x] **Read-only guard**: ensure write tools respect `READONLY_MODE` and short-circuit with clear messages.
- [x] **Logging**: add structured logs for each new tool (start, success, error, counts/IDs).
- [x] **Validation**: use `zod` schemas for inputs; add confirmation flags for destructive actions.
- [ ] **Docs**: update `AGENTS.md` and `README.md` with new tools and command examples; include coverage matrix.

## Sequence to execute
1) Implement survey lifecycle tools (`survey-management.ts`) and response CRUD/export gaps.
2) Add quotas + language setters (they’re small) while touching service client.
3) Fill group/question CRUD; wire properties setters.
4) Add participant comms + token activation.
5) Add admin/site utilities; regenerate docs & tool listing.

## Definition of Done
- All RemoteControl2 methods have a corresponding tool or an explicit rationale for omission (documented in README/AGENTS).
- `logRegisteredTools` shows all tools in both normal and read-only modes (write tools excluded when `READONLY_MODE=true`).
- Manual smoke: run `npm run build`; call each new tool once against a test LimeSurvey instance or mocked responses.
