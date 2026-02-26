
# LimeSurvey MCP Server

A Model Context Protocol (MCP) server that exposes LimeSurvey Remote API functionality as MCP tools. This server provides a standardized way to interact with LimeSurvey's powerful survey management capabilities through MCP clients.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
  - [Survey Management](#survey-management)
  - [Question Management](#question-management)
  - [Response Management](#response-management)
  - [Participant Management](#participant-management)
  - [Statistics Management](#statistics-management)
- [Development](#development)
- [License](#license)

## Installation

```bash
# Clone the repository
git clone https://github.com/TonisOrmisson/limesurvey-mcp.git
cd limesurvey-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# LimeSurvey Remote API Settings
LIMESURVEY_API_URL=https://your-limesurvey-instance.com/admin/remotecontrol
LIMESURVEY_USERNAME=your_username
LIMESURVEY_PASSWORD=your_password

# Server settings
PORT=3000

# Optional: run in read‑only mode
# When true, all write tools short‑circuit and return an error message
# instead of calling LimeSurvey.
READONLY_MODE=false
```

## Usage

Once the server is running, you can use any MCP client to connect to it and access LimeSurvey functionality.

Example MCP client snippet (pseudo‑YAML) to list surveys:

```yaml
tool: listSurveys
args: {}
```

## API Reference

### RemoteControl2 Coverage

The table below shows how LimeSurvey RemoteControl2 methods are exposed as MCP tools
in this server. Methods that are not implemented here are either not available in
the target LimeSurvey instance or intentionally skipped (for example unstable or
undocumented endpoints).

| Domain              | RemoteControl2 method        | MCP tool name              | Notes                                  |
|---------------------|------------------------------|----------------------------|----------------------------------------|
| Surveys             | `list_surveys`               | `listSurveys`              | read‑only                              |
| Surveys             | `get_survey_properties`      | `getSurveyProperties`      | read‑only                              |
| Surveys             | `activate_survey`            | `activateSurvey`           | write (guarded by `READONLY_MODE`)     |
| Surveys             | `get_language_properties`    | `getSurveyLanguageProperties` | read‑only                           |
| Surveys             | `get_site_settings`          | `getAvailableLanguages`    | reads `availablelanguages` setting     |
| Surveys             | — (derived)                  | `getSurveyLanguages`       | derived from survey properties         |
| Surveys             | `get_fieldmap`               | `getFieldMap`              | read‑only                              |
| Survey lifecycle    | `add_survey`                 | `addSurvey`                | write (guarded)                        |
| Survey lifecycle    | `import_survey`              | `importSurvey`             | write (guarded)                        |
| Survey lifecycle    | `copy_survey`                | `copySurvey`               | write (guarded)                        |
| Survey lifecycle    | `delete_survey`              | `deleteSurvey`             | write (guarded, confirmation required) |
| Survey lifecycle    | `activate_tokens`            | `activateTokens`           | write (guarded)                        |
| Survey lifecycle    | `set_survey_properties`      | `setSurveyProperties`      | write (guarded)                        |
| Question groups     | `list_groups`                | `listQuestionGroups`       | read‑only                              |
| Question groups     | `get_group_properties`       | `getGroupProperties`       | read‑only                              |
| Question groups     | `set_group_properties`       | `setGroupProperties`       | write (guarded)                        |
| Questions           | `list_questions`             | `listQuestions`            | read‑only                              |
| Questions           | `get_question_properties`    | `getQuestionProperties`    | read‑only                              |
| Questions           | `set_question_properties`    | `setQuestionProperties`    | write (guarded)                        |
| Responses           | `get_summary`                | `getResponseSummary`       | read‑only                              |
| Responses           | `list_response_exports`      | `listResponseExportFormats`| read‑only discovery (plugin‑aware)     |
| Responses           | `export_responses`           | `exportResponses`          | read‑only export                       |
| Responses           | `add_response`               | `addResponse`              | write (guarded)                        |
| Responses           | `update_response`            | `updateResponse`           | write (guarded)                        |
| Responses           | `delete_response`            | `deleteResponse`           | write (guarded, confirmation required) |
| Responses           | `get_response_ids`           | `getResponseIds`           | read‑only                              |
| Responses           | `export_responses_by_token`  | `exportResponsesByToken`   | read‑only export                       |
| Responses           | `export_timeline`            | `exportTimeline`           | read‑only aggregated counts            |
| Files               | `upload_file`                | `uploadFile`               | write (guarded)                        |
| Files               | `get_uploaded_files`         | `listUploadedFiles`        | read‑only                              |
| Participants/tokens | `add_participants`           | `addParticipant`, `addMultipleParticipants` | write (guarded)            |
| Participants/tokens | `list_participants`          | `listParticipants`, `listFilteredParticipants` | read‑only                  |
| Participants/tokens | `get_participant_properties` | `getParticipantProperties` | read‑only                              |
| Participants/tokens | `delete_participants`        | `deleteParticipants`       | write (guarded, confirmation required) |
| Participants/tokens | `invite_participants`        | `inviteParticipants`       | write (guarded, email/notification)    |
| Participants/tokens | `remind_participants`        | `remindParticipants`       | write (guarded, email/notification)    |
| Quotas              | `get_quota_properties`       | `getQuotaProperties`       | read‑only; no list‑all wrapper         |
| Quotas              | `add_quota`                  | `addQuota`                 | write (guarded)                        |
| Quotas              | `set_quota_properties`       | `setQuotaProperties`       | write (guarded)                        |
| Quotas              | `delete_quota`               | `deleteQuota`              | write (guarded, confirmation required) |
| Languages           | `add_language`               | `addSurveyLanguage`        | write (guarded)                        |
| Languages           | `delete_language`            | `deleteSurveyLanguage`     | write (guarded, confirmation required) |
| Languages           | `set_language_properties`    | `setSurveyLanguageProperties` | write (guarded)                     |
| Site settings       | `get_site_settings`          | `getAvailableLanguages`    | read‑only                              |

When `READONLY_MODE=true` is set in the environment, all tools marked as “write
(guarded)” above will return a clear error message without calling LimeSurvey.

### Survey Management

#### listSurveys

Lists all surveys that the authenticated user has permission to access.

**Parameters**: None

**Returns**:
- Array of survey objects with properties:
  - `sid`: Survey ID
  - `surveyls_title`: Survey title
  - `active`: Whether the survey is active ("Y" or "N")
  - `expires`: Expiration date (if set)
  - `startdate`: Start date (if set)
  - And other survey metadata

**Example Response**:
```json
[
  {
    "sid": "123456",
    "surveyls_title": "Customer Satisfaction Survey",
    "active": "Y",
    "expires": null,
    "startdate": "2023-01-01 00:00:00"
  },
  {
    "sid": "789012",
    "surveyls_title": "Employee Feedback",
    "active": "N",
    "expires": "2023-12-31 23:59:59",
    "startdate": "2023-06-01 00:00:00"
  }
]
```

#### getSurveyProperties

Gets detailed properties of a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey to get properties for

**Returns**:
- Object containing survey properties including settings, configuration, and metadata

#### activateSurvey

Activates a survey that is currently inactive.

**Parameters**:
- `surveyId`: The ID of the survey to activate

**Returns**:
- Result of the activation process

#### getSurveyLanguageProperties

Gets language-specific properties for a survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `language`: The language code

**Returns**:
- Object containing language-specific properties for the survey

#### getAvailableLanguages

Gets available languages in the LimeSurvey installation.

**Parameters**: None

**Returns**:
- List of available language codes and their names

#### getSurveyLanguages

Gets available languages for a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey

**Returns**:
- Array of language codes available for the survey

#### getQuotaProperties

Gets properties for a specific quota.

This tool wraps the `get_quota_properties` RemoteControl method:
`get_quota_properties($sessionKey, $iQuotaId, $aQuotaSettings = null, $sLanguage = null)`.
Listing all quotas for a survey is not supported via this MCP server.

**Parameters**:
- `quotaId`: Specific quota ID (required)
- `language` (optional): Language for quota descriptions

**Returns**:
- Quota information for the given quota ID

#### addQuota

Adds a new quota to a survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `name`: Quota name
- `limit`: Maximum number of responses for the quota

**Returns**:
- Result object from LimeSurvey containing the created quota data

#### setQuotaProperties

Updates properties of an existing quota.

**Parameters**:
- `quotaId`: The ID of the quota to update
- `properties`: Object with quota fields to update (for example `name`, `limit`, `active`, `action`, `message`, `url`)

**Returns**:
- Result object describing the updated quota

#### deleteQuota

Deletes an existing quota.

**Parameters**:
- `quotaId`: The ID of the quota to delete

**Returns**:
- Result object indicating whether the quota was deleted successfully

#### addSurveyLanguage

Adds a new language to a survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `language`: Language code to add (for example `"de"`, `"fr"`)

**Returns**:
- Result object from LimeSurvey for the language addition

#### deleteSurveyLanguage

Deletes a language from a survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `language`: Language code to remove

**Returns**:
- Result object indicating whether the language was deleted

#### setSurveyLanguageProperties

Sets language‑specific properties for a survey language.

**Parameters**:
- `surveyId`: The ID of the survey
- `language` (optional): Language code; omit to target the base language
- `localeData`: Object with locale fields to update (for example `surveyls_title`, `surveyls_description`, `surveyls_welcometext`)

**Returns**:
- Result object describing the updated language properties

#### setSurveyProperties

Sets properties for a survey.

This tool wraps the `set_survey_properties` RemoteControl method:
`set_survey_properties($sessionKey, $iSurveyID, $aSurveyData)`. Some fields
(for example `sid`, `active`, `language`, `additional_languages`, and several
fields on active surveys) cannot be changed and will be ignored by LimeSurvey.

**Parameters**:
- `surveyId`: The ID of the survey
- `properties`: Object of survey fields to update

**Returns**:
- Result object describing which fields were updated successfully

### Question Management

#### listQuestions

Lists all questions for a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `groupId` (optional): Get only questions from this group
- `language` (optional): Language for question texts

**Returns**:
- Array of question objects with properties including ID, text, type, and other settings

#### listQuestionGroups

Lists all question groups for a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `language` (optional): Language for group texts

**Returns**:
- Array of question group objects with properties including ID, title, description, and order

#### getQuestionProperties

Gets properties for a specific question.

**Parameters**:
- `questionId`: The ID of the question
- `language` (optional): Language for question texts
- `properties` (optional): Array of property names to retrieve

**Returns**:
- Object containing the requested properties for the question

### Response Management

#### getResponseSummary

Gets summary information about a survey's collected responses.

**Parameters**:
- `surveyId`: The ID of the survey

**Returns**:
- Summary object containing information about response counts and status

#### listResponseExportFormats

Lists available response export formats for a survey, including plugin-provided types.

**Parameters**:
- `surveyId`: The ID of the survey

**Returns**:
- A list of export format objects with:
  - `type`
  - `pluginClass`
  - `label` (nullable)
  - `tooltip` (nullable)
  - `onclick` (nullable)
  - `isDefault` (boolean)

#### exportResponses

Exports responses from a survey in the specified format.

**Parameters**:
- `surveyId`: The ID of the survey
- `documentType`: Export format type (dynamic/plugin-aware). Call `listResponseExportFormats` first - default: "csv"
- `language` (optional): Language for response export
- `completionStatus`: Filter by completion status ('complete', 'incomplete', 'all') - default: "all"
- `headingType`: Type of headings ('code', 'full', 'abbreviated') - default: "code"
- `responseType`: Response type ('short' or 'long') - default: "short"
- `fields` (optional): Array of field names to export

**Returns**:
- Exported data in the requested format

#### Discovery-first export workflow

1. Call `listResponseExportFormats` to discover valid `type` values for the target survey.
2. Pick one returned `type` (for example `csv`, `json`, or a custom plugin format).
3. Call `exportResponses` with that `documentType`.

**Example**:
```yaml
tool: listResponseExportFormats
args:
  surveyId: "123456"
---
tool: exportResponses
args:
  surveyId: "123456"
  documentType: "csv"
```

#### listResponses

Lists IDs of responses for a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `start`: Starting response index - default: 0
- `limit`: Number of responses to return - default: 10
- `attributes` (optional): Array of attribute names to include

**Returns**:
- Array of response IDs and requested attributes

### Participant Management

#### addParticipant

Adds a participant to a survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `email`: Participant email address
- `firstName` (optional): First name
- `lastName` (optional): Last name
- `language` (optional): Language code
- `usesLeft`: Number of times the participant can access the survey - default: 1
- `validFrom` (optional): Valid from date (YYYY-MM-DD HH:mm:ss)
- `validUntil` (optional): Valid until date (YYYY-MM-DD HH:mm:ss)

**Returns**:
- Participant data including the generated token

#### listParticipants

Lists participants for a specific survey.

**Parameters**:
- `surveyId`: The ID of the survey
- `start`: Starting participant index - default: 0
- `limit`: Number of participants to return - default: 10
- `unused`: Only show unused tokens - default: false
- `attributes` (optional): Array of attribute names to include

**Returns**:
- Array of participant objects with requested attributes

#### getParticipantProperties

Gets properties of a specific participant/token.

**Parameters**:
- `surveyId`: The ID of the survey
- `tokenId`: The token ID
- `attributes` (optional): Array of attribute names to include

**Returns**:
- Object containing properties for the specified participant

### Statistics Management

#### exportStatistics

Exports survey statistics in PDF, Excel, or HTML format with optional graphs.

**Parameters**:
- `surveyId`: The ID of the survey to export statistics for
- `documentType`: Format of the export: 'pdf', 'xls', or 'html' - default: "pdf"
- `language` (optional): Language for statistics export (default: survey's default language)
- `includeGraphs`: Whether to include graphs in the export (only applicable for PDF) - default: false
- `groupIds` (optional): Specific question group ID(s) to include in statistics, can be a single ID or array of IDs

**Returns**:
- Base64 encoded string containing the statistics file in the requested format

**Example Usage**:
```
exportStatistics:
  surveyId: "123456"
  documentType: "pdf"
  includeGraphs: true
```

## Development

This project is built using:
- [Node.js](https://nodejs.org/)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP server SDK
- [TypeScript](https://www.typescriptlang.org/) - For type safety and modern JavaScript features
- [dotenv](https://www.npmjs.com/package/dotenv) - For environment variable management
- [Axios](https://axios-http.com/) - For HTTP requests to LimeSurvey Remote API

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## License

[MIT](LICENSE)
