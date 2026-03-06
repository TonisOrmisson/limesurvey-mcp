import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';

type ResponseExportFormat = {
  type: string;
  pluginClass: string;
  label: string | null;
  tooltip: string | null;
  onclick: string | null;
  isDefault: boolean;
};

type TextContent = {
  type: "text";
  text: string;
};

const textFormats = ['csv', 'json', 'txt', 'html'];

function textContent(text: string): TextContent {
  return { type: "text", text };
}

function buildExportPayloadContent(
  exportData: string,
  documentType: string,
  decodeOutput: boolean,
  summaryLine: string
): TextContent[] {
  const normalizedDocumentType = documentType.toLowerCase();
  const isBinaryFormat = !textFormats.includes(normalizedDocumentType);
  const payloadLabel = isBinaryFormat || !decodeOutput ? 'Base64 payload' : 'Raw base64 payload';
  const content: TextContent[] = [textContent(summaryLine)];

  if (decodeOutput && !isBinaryFormat && exportData) {
    try {
      const decodedData = Buffer.from(exportData, 'base64').toString('utf-8');
      let previewText = '';

      if (normalizedDocumentType === 'json') {
        try {
          previewText = JSON.stringify(JSON.parse(decodedData), null, 2).substring(0, 1000);
        } catch {
          previewText = decodedData.substring(0, 1000);
        }
      } else {
        previewText = decodedData.substring(0, 1000);
      }

      if (decodedData.length > 1000) {
        previewText += '\n...[truncated]';
      }

      content.push(textContent(`Preview of exported data:\n\n${previewText}`));
    } catch (error) {
      content.push(
        textContent(`Failed to decode base64 data: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  content.push(textContent(`${payloadLabel}:\n${exportData}`));
  return content;
}

/**
 * Tool to get response count summary for a survey
 * 
 * Corresponds to the get_summary method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_summary
 * 
 * Returns summary information about a survey's collected responses
 */
server.tool(
  "getResponseSummary", 
  "Gets summary information about a survey's collected responses",
  {
    surveyId: z.string().describe("The ID of the survey")
  },
  async ({ surveyId }) => {
    logger.info('Getting response summary', { surveyId });
    try {
      const summary = await limesurveyAPI.getResponseCount(surveyId);
      logger.info('Successfully retrieved response summary', { 
        surveyId,
        responseCount: summary?.count || 0
      });
      return {
        content: [
          { 
            type: "text", 
            text: `Response summary for survey ID ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(summary, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get response summary', { 
        surveyId, 
        error: error?.message 
      });
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving response summary: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

export async function listResponseExportFormatsHandler() {
  logger.info('Listing response export formats');
  try {
    const exportsResult = await limesurveyAPI.listResponseExports();

    if (!Array.isArray(exportsResult)) {
      const status = typeof exportsResult?.status === 'string'
        ? exportsResult.status
        : 'Unexpected response format';
      logger.error('Failed to list response export formats', { error: status });
      return {
        content: [
          textContent(`Error listing response export formats: ${status}`),
          textContent(JSON.stringify(exportsResult, null, 2))
        ],
        isError: true
      };
    }

    const responseExports = exportsResult as ResponseExportFormat[];
    const defaultTypes = responseExports.filter((item) => item.isDefault).map((item) => item.type);
    const defaultSummary = defaultTypes.length > 0
      ? ` Default format(s): ${defaultTypes.join(', ')}.`
      : '';

    logger.info('Successfully listed response export formats', {
      formatCount: responseExports.length,
      defaultCount: defaultTypes.length
    });

    return {
      content: [
        textContent(`Response export formats: ${responseExports.length} format(s).${defaultSummary}`),
        textContent(JSON.stringify(responseExports, null, 2))
      ]
    };
  } catch (error: any) {
    logger.error('Failed to list response export formats', {
      error: error?.message
    });
    return {
      content: [textContent(`Error listing response export formats: ${error?.message || 'Unknown error'}`)],
      isError: true
    };
  }
}

server.tool(
  "listResponseExportFormats",
  "Lists globally discoverable response export formats, including plugin-provided formats",
  {},
  listResponseExportFormatsHandler
);

/**
 * Tool to export responses from a survey with base64 encoding
 * 
 * Corresponds to the export_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_responses
 * 
 * Returns response data in the specified format as a base64-encoded string or decoded content
 */
type ExportResponsesArgs = {
  surveyId: string;
  documentType: string;
  language?: string;
  completionStatus: 'complete' | 'incomplete' | 'all';
  headingType: 'code' | 'full' | 'abbreviated';
  responseType: 'short' | 'long';
  fromResponseId?: number;
  toResponseId?: number;
  fields?: string[];
  additionalOptions?: Record<string, any>;
  decodeOutput: boolean;
};

export async function exportResponsesHandler({
  surveyId,
  documentType,
  language,
  completionStatus,
  headingType,
  responseType,
  fromResponseId,
  toResponseId,
  fields,
  additionalOptions,
  decodeOutput
}: ExportResponsesArgs) {
  logger.info('Exporting responses', {
    surveyId,
    documentType,
    language: language || 'default',
    completionStatus,
    responseType,
    fromResponseId: fromResponseId || 'start',
    toResponseId: toResponseId || 'end'
  });
  try {
    const exportData = await limesurveyAPI.exportResponses(
      surveyId,
      documentType,
      language || null,
      completionStatus,
      headingType,
      responseType,
      fromResponseId || null,
      toResponseId || null,
      fields || null,
      additionalOptions || null
    );
    const sizeKB = Math.round(exportData.length * 0.75 / 1024);
    logger.info('Successfully exported responses', {
      surveyId,
      documentType,
      sizeKB,
      decodeOutput
    });

    return {
      content: buildExportPayloadContent(
        exportData,
        documentType,
        decodeOutput,
        `Responses for survey ID ${surveyId} exported successfully as ${documentType} (base64 encoded, ~${sizeKB} KB)`
      )
    };
  } catch (error: any) {
    logger.error('Failed to export responses', {
      surveyId,
      documentType,
      error: error?.message
    });
    return {
      content: [textContent(`Error exporting responses: ${error?.message || 'Unknown error'}`)],
      isError: true
    };
  }
}

server.tool(
  "exportResponses",
  "Exports responses from a survey in the specified format. Call listResponseExportFormats first to discover valid formats.",
  {
    surveyId: z.string().describe("The ID of the survey"),
    documentType: z.string().default("csv").describe("Format type to export. Dynamic/plugin-aware; call listResponseExportFormats first."),
    language: z.string().optional().describe("Optional: Language for response export"),
    completionStatus: z.enum(['complete', 'incomplete', 'all']).default('all').describe("Filter by completion status"),
    headingType: z.enum(['code', 'full', 'abbreviated']).default('code').describe("Type of headings"),
    responseType: z.enum(['short', 'long']).default('short').describe("Response type"),
    fromResponseId: z.number().optional().describe("Optional: Export from this response ID"),
    toResponseId: z.number().optional().describe("Optional: Export up to this response ID"),
    fields: z.array(z.string()).optional().describe("Optional: Array of field names to export"),
    additionalOptions: z.record(z.any()).optional().describe("Optional: Additional options for export formatting"),
    decodeOutput: z.boolean().default(true).describe("Whether to decode the base64 output for text formats")
  },
  exportResponsesHandler
);

logger.info("Responses tools registered!");

/**
 * Add a single response
 */
server.tool(
  "addResponse",
  "Adds a response to a survey",
  {
    surveyId: z.string().describe("Survey ID"),
    responseData: z.record(z.any()).describe("Response data as key/value map")
  },
  async ({ surveyId, responseData }) => {
    const readonly = ensureWriteAllowed('addResponse');
    if (readonly) {
      return readonly;
    }

    logger.info('Adding response', { surveyId });
    try {
      const responseId = await limesurveyAPI.addResponse(surveyId, responseData);
      return {
        content: [{ type: "text", text: `Response added to survey ${surveyId} with ID ${responseId}` }]
      };
    } catch (error: any) {
      logger.error('Failed to add response', { surveyId, error: error?.message });
      return {
        content: [{ type: "text", text: `Error adding response: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Update a response
 */
server.tool(
  "updateResponse",
  "Updates an existing response",
  {
    surveyId: z.string().describe("Survey ID"),
    responseId: z.string().describe("Response ID"),
    responseData: z.record(z.any()).describe("Fields to update")
  },
  async ({ surveyId, responseId, responseData }) => {
    const readonly = ensureWriteAllowed('updateResponse');
    if (readonly) {
      return readonly;
    }

    logger.info('Updating response', { surveyId, responseId });
    try {
      const result = await limesurveyAPI.updateResponse(surveyId, responseId, responseData);
      return {
        content: [{ type: "text", text: `Response ${responseId} updated: ${result}` }]
      };
    } catch (error: any) {
      logger.error('Failed to update response', { surveyId, responseId, error: error?.message });
      return {
        content: [{ type: "text", text: `Error updating response: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Delete a single response
 */
server.tool(
  "deleteResponse",
  "Deletes a single response",
  {
    surveyId: z.string().describe("Survey ID"),
    responseId: z.string().describe("Response ID"),
    confirmDeletion: z.literal(true).describe("Must be true to delete")
  },
  async ({ surveyId, responseId }) => {
    const readonly = ensureWriteAllowed('deleteResponse');
    if (readonly) {
      return readonly;
    }

    logger.warn('Deleting response', { surveyId, responseId });
    try {
      const result = await limesurveyAPI.deleteResponse(surveyId, responseId);
      return {
        content: [
          { type: "text", text: `Response ${responseId} deleted from survey ${surveyId}` },
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete response', { surveyId, responseId, error: error?.message });
      return {
        content: [{ type: "text", text: `Error deleting response: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// NOTE: The LimeSurvey RemoteControl API does not expose a documented
// `get_response`, `delete_all_responses`, `set_response_status` or
// `import_responses` method. We therefore do NOT expose tools for those
// names to avoid calling non‑existent endpoints. Use `getResponseIds`
// + `exportResponses`/`exportResponsesByToken` for read access, and
// `addResponse`/`updateResponse`/`deleteResponse` for write operations.

/**
 * Get response IDs (optionally by token)
 */
server.tool(
  "getResponseIds",
  "Gets response IDs for a survey, optionally filtered by token",
  {
    surveyId: z.string().describe("Survey ID"),
    token: z.string().optional().describe("Filter by token")
  },
  async ({ surveyId, token }) => {
    logger.info('Getting response IDs', { surveyId, token: token || 'all' });
    try {
      const ids = await limesurveyAPI.getResponseIds(surveyId, token || null);
      return {
        content: [
          { type: "text", text: `Response IDs for survey ${surveyId}${token ? ' (token ' + token + ')' : ''}` },
          { type: "text", text: JSON.stringify(ids, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get response IDs', { surveyId, token, error: error?.message });
      return {
        content: [{ type: "text", text: `Error getting response IDs: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Export responses by token
 */
type ExportResponsesByTokenArgs = {
  surveyId: string;
  token: string;
  documentType: string;
  language?: string;
  completionStatus: 'complete' | 'incomplete' | 'all';
  headingType: 'code' | 'full' | 'abbreviated';
  responseType: 'short' | 'long';
  decodeOutput: boolean;
};

export async function exportResponsesByTokenHandler({
  surveyId,
  token,
  documentType,
  language,
  completionStatus,
  headingType,
  responseType,
  decodeOutput
}: ExportResponsesByTokenArgs) {
  logger.info('Exporting responses by token', { surveyId, token, documentType });
  try {
    const exportData = await limesurveyAPI.exportResponsesByToken(
      surveyId,
      documentType,
      [token],
      language || null,
      completionStatus,
      headingType,
      responseType,
      null
    );

    const sizeKB = Math.round(exportData.length * 0.75 / 1024);
    return {
      content: buildExportPayloadContent(
        exportData,
        documentType,
        decodeOutput,
        `Responses for token ${token} exported as ${documentType} (base64 encoded, ~${sizeKB} KB)`
      )
    };
  } catch (error: any) {
    logger.error('Failed to export responses by token', { surveyId, token, error: error?.message });
    return {
      content: [textContent(`Error exporting responses by token: ${error?.message || 'Unknown error'}`)],
      isError: true
    };
  }
}

server.tool(
  "exportResponsesByToken",
  "Exports responses for a specific token",
  {
    surveyId: z.string().describe("Survey ID"),
    token: z.string().describe("Token value"),
    documentType: z.string().default("csv").describe("csv, xls, pdf, html, json"),
    language: z.string().optional().describe("Language code"),
    completionStatus: z.enum(['complete', 'incomplete', 'all']).default('all').describe("Completion filter"),
    headingType: z.enum(['code', 'full', 'abbreviated']).default('code').describe("Heading type"),
    responseType: z.enum(['short', 'long']).default('short').describe("Response type"),
    decodeOutput: z.boolean().default(true).describe("Decode base64 for text formats")
  },
  exportResponsesByTokenHandler
);

/**
 * Export response timeline
 */
server.tool(
  "exportTimeline",
  "Exports aggregated response timeline (counts per day or hour)",
  {
    surveyId: z.string().describe("Survey ID"),
    period: z.enum(['day', 'hour']).default('day').describe("Aggregation period: 'day' or 'hour'"),
    dateFrom: z.string().describe("Start date (YYYY-MM-DD HH:mm:ss)"),
    dateTo: z.string().describe("End date (YYYY-MM-DD HH:mm:ss)")
  },
  async ({ surveyId, period, dateFrom, dateTo }) => {
    logger.info('Exporting timeline', { surveyId, period, dateFrom, dateTo });
    try {
      return {
        content: [
          { type: "text", text: `Timeline for survey ${surveyId} (${period}) from ${dateFrom} to ${dateTo}` },
          { type: "text", text: JSON.stringify(await limesurveyAPI.exportTimeline(surveyId, period, dateFrom, dateTo), null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to export timeline', { surveyId, error: error?.message });
      return {
        content: [{ type: "text", text: `Error exporting timeline: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Upload a file for a response
 */
server.tool(
  "uploadFile",
  "Uploads a file for a survey",
  {
    surveyId: z.string().describe("Survey ID"),
    fieldName: z.string().describe("SGQA of the file upload question (e.g. 12345X1X2)"),
    fileName: z.string().describe("File name"),
    fileDataBase64: z.string().describe("File content base64")
  },
  async ({ surveyId, fieldName, fileName, fileDataBase64 }) => {
    const readonly = ensureWriteAllowed('uploadFile');
    if (readonly) {
      return readonly;
    }

    logger.info('Uploading file', { surveyId, fieldName, fileName });
    try {
      const metadata = await limesurveyAPI.uploadFile(surveyId, fieldName, fileDataBase64, fileName);
      return {
        content: [
          { type: "text", text: `File uploaded for survey ${surveyId} on field ${fieldName}` },
          { type: "text", text: JSON.stringify(metadata, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to upload file', { surveyId, fileName, error: error?.message });
      return {
        content: [{ type: "text", text: `Error uploading file: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * List uploaded files
 */
server.tool(
  "listUploadedFiles",
  "Lists uploaded files for a survey",
  {
    surveyId: z.string().describe("Survey ID"),
    token: z.string().describe("Participant token whose uploads to list"),
    responseId: z.string().optional().describe("Optional response ID to narrow results")
  },
  async ({ surveyId, token, responseId }) => {
    logger.info('Listing uploaded files', { surveyId, token, responseId });
    try {
      const files = await limesurveyAPI.getUploadedFiles(
        surveyId,
        token,
        responseId ?? null
      );
      return {
        content: [
          { type: "text", text: `Uploaded files for survey ${surveyId} and token ${token}` },
          { type: "text", text: JSON.stringify(files, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to list uploaded files', { surveyId, error: error?.message });
      return {
        content: [{ type: "text", text: `Error listing uploaded files: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);
