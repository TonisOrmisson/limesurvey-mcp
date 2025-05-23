# ⚠️ ATTENTION: LLM-GENERATED CODE ⚠️

> **WARNING**: This codebase was generated by a Large Language Model (LLM). While efforts have been made to ensure accuracy and functionality, this code should be thoroughly reviewed and tested before use in production environments. Use at your own risk.

---

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
```

## Usage

Once the server is running, you can use any MCP client to connect to it and access LimeSurvey functionality.

## API Reference

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

#### exportResponses

Exports responses from a survey in the specified format.

**Parameters**:
- `surveyId`: The ID of the survey
- `documentType`: Format of the export (csv, xls, pdf, html, json) - default: "csv"
- `language` (optional): Language for response export
- `completionStatus`: Filter by completion status ('complete', 'incomplete', 'all') - default: "all"
- `headingType`: Type of headings ('code', 'full', 'abbreviated') - default: "code"
- `responseType`: Response type ('short' or 'long') - default: "short"
- `fields` (optional): Array of field names to export

**Returns**:
- Exported data in the requested format

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