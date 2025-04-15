import { z } from 'zod';
import { server } from './server.js';
import limesurveyAPI from './services/limesurvey-api.js';

/**
 * Tool to get summary statistics for a survey
 * 
 * Corresponds to the get_summary method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_summary
 * 
 * Returns a summary of survey responses including:
 * - completed_responses: Number of completed responses
 * - incomplete_responses: Number of incomplete responses
 * - full_responses: Total number of responses
 */
server.tool(
  "getSurveyResponseCount",
  "Gets summary statistics about responses for a specific survey",
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
          text: `Error retrieving survey response summary: ${error?.message || 'Unknown error'}` 
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
 * Returns the response data in the requested format
 */
server.tool(
  "exportSurveyResponses",
  "Exports responses from a survey in various formats",
  {
    surveyId: z.string().describe("The ID of the survey"),
    documentType: z.enum(['csv', 'xls', 'pdf', 'html', 'json']).default('csv').describe("Format of the export"),
    language: z.string().optional().describe("Language code (optional)"),
    completionStatus: z.enum(['all', 'complete', 'incomplete']).default('all').describe("Filter by completion status"),
    headingType: z.enum(['code', 'full', 'abbreviated']).default('code').describe("Type of heading to use"),
    responseType: z.enum(['short', 'long']).default('short').describe("Type of response data to include")
  },
  async ({ surveyId, documentType = 'csv', language = null, completionStatus = 'all', headingType = 'code', responseType = 'short' }) => {
    try {
      const exportData = await limesurveyAPI.exportResponses(
        surveyId,
        documentType,
        language,
        completionStatus,
        headingType,
        responseType
      );
      
      return {
        content: [
          { 
            type: "text", 
            text: `Responses for survey ID ${surveyId} exported successfully as ${documentType.toUpperCase()}` 
          },
          {
            type: "text", 
            text: `Export data is a base64-encoded string of length: ${exportData.length}`
          }
        ],
        // Include the base64 data in a separate field that can be downloaded
        data: {
          format: documentType,
          content: exportData,
          filename: `survey_${surveyId}_responses.${documentType}`
        }
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting survey responses: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);