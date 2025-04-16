import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

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
    try {
      const summary = await limesurveyAPI.getResponseCount(surveyId);
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

/**
 * Tool to export responses from a survey
 * 
 * Corresponds to the export_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_responses
 * 
 * Returns response data in the specified format
 */
server.tool(
  "exportResponses",
  "Exports responses from a survey in the specified format",
  {
    surveyId: z.string().describe("The ID of the survey"),
    documentType: z.string().default("csv").describe("Format of the export (csv, xls, pdf, html, json)"),
    language: z.string().optional().describe("Optional: Language for response export"),
    completionStatus: z.string().default("all").describe("Filter by completion status: 'complete', 'incomplete' or 'all'"),
    headingType: z.string().default("code").describe("Type of headings: 'code', 'full' or 'abbreviated'"),
    responseType: z.string().default("short").describe("Response type: 'short' or 'long'"),
    fields: z.array(z.string()).optional().describe("Optional: Array of field names to export")
  },
  async ({ surveyId, documentType, language, completionStatus, headingType, responseType, fields }) => {
    try {
      const exportData = await limesurveyAPI.exportResponses(
        surveyId, 
        documentType, 
        language || null, 
        completionStatus, 
        headingType, 
        responseType, 
        fields || null
      );
      
      // For CSV, JSON and other text formats, show a sample of the data
      let preview = "Data not available for preview";
      if (typeof exportData === 'string') {
        if (documentType === 'json') {
          try {
            const jsonData = JSON.parse(exportData);
            preview = JSON.stringify(jsonData, null, 2).substring(0, 1000) + 
              (exportData.length > 1000 ? '...' : '');
          } catch (e) {
            preview = exportData.substring(0, 1000) + 
              (exportData.length > 1000 ? '...' : '');
          }
        } else {
          preview = exportData.substring(0, 1000) + 
            (exportData.length > 1000 ? '...' : '');
        }
      }
      
      return {
        content: [
          { 
            type: "text", 
            text: `Responses for survey ID ${surveyId} exported successfully as ${documentType}` 
          },
          {
            type: "text", 
            text: `Preview of exported data:\n\n${preview}`
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting responses: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to list responses for a specific survey
 * 
 * Corresponds to the list_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_responses
 * 
 * Lists IDs of responses for a survey
 */
server.tool(
  "listResponses",
  "Lists IDs of responses for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    start: z.number().default(0).describe("Starting response index"),
    limit: z.number().default(10).describe("Number of responses to return"),
    attributes: z.array(z.string()).optional().describe("Optional: Array of attribute names to include")
  },
  async ({ surveyId, start, limit, attributes }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const responses = await limesurveyAPI.request(
        'list_responses', 
        [key, surveyId, start, limit, false, attributes || null]
      );
      return {
        content: [
          { 
            type: "text", 
            text: `Response IDs for survey ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(responses, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error listing responses: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Responses tools registered!");