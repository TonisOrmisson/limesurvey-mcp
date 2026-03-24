# TOON Implementation Plan

This document outlines the plan to replace JSON with [TOON (Token-Oriented Object Notation)](https://github.com/toon-format/toon) as the primary output format for all MCP tools in this repository.

## Objectives
- **Reduce Token Usage:** Leverage TOON's compact representation to save ~40% tokens in LLM interactions.
- **Improve LLM Accuracy:** Use TOON's explicit structures (tabular arrays, length guards) to help the model parse and understand data more reliably.
- **Maintain API Integrity:** Keep the underlying LimeSurvey API communication in JSON while transforming the output presented to the LLM.

## Phase 1: Core Infrastructure
1. **Dependency Management:**
   - Install `@toon-format/toon`.
2. **Centralized Utility:**
   - Create `src/utils/toon.ts`.
   - Implement `formatForLLM(data: any): string` which uses `toon.encode`.
   - Add error handling and fallback to `JSON.stringify` for safety.

## Phase 2: Tool Refactoring
Systematically update all tools in `src/tools/` to use the new TOON formatter.
- [ ] `src/tools/surveys.ts`
- [ ] `src/tools/questions.ts`
- [ ] `src/tools/groups.ts`
- [ ] `src/tools/responses.ts`
- [ ] `src/tools/participants.ts`
- [ ] `src/tools/survey-management.ts`
- [ ] `src/tools/group-management.ts`
- [ ] `src/tools/question-management.ts`
- [ ] `src/tools/quotas.ts`
- [ ] `src/tools/languages.ts`
- [ ] `src/tools/statistics.ts`

## Phase 3: Error Handling & Logging
1. **API Error Reporting:**
   - Update `src/services/limesurvey-api.ts` to format error results in TOON when passed to the LLM.
2. **Operational Logging:**
   - Update `src/utils/logger.ts` to use TOON for metadata if it improves readability for developers/LLMs monitoring logs.

## Phase 4: Validation & Quality Assurance
1. **Testing:**
   - Update existing test suites in `src/tests/` to verify TOON output.
   - Add specific tests for TOON encoding of various LimeSurvey data structures (e.g., survey lists, participant arrays).
2. **Documentation:**
   - Update `AGENTS.md` with the mandatory requirement to use TOON for all new tools.
   - Update `README.md` to highlight TOON support for token efficiency.

## Schedule
- **Step 1:** Infrastructure & Utility (Today)
- **Step 2:** Batch Tool Refactoring (Today)
- **Step 3:** Validation & Tests (Today)
- **Step 4:** Final Documentation (Today)
