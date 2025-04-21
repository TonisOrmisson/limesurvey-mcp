import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

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

/**
 * Tool to export responses from a survey with base64 encoding
 * 
 * Corresponds to the export_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_responses
 * 
 * Returns response data in the specified format as a base64-encoded string or decoded content
 */
server.tool(
  "exportResponses",
  "Exports responses from a survey in the specified format",
  {
    surveyId: z.string().describe("The ID of the survey"),
    documentType: z.string().default("csv").describe("Format of the export (csv, xls, pdf, html, json)"),
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
  async ({ surveyId, documentType, language, completionStatus, headingType, responseType, 
           fromResponseId, toResponseId, fields, additionalOptions, decodeOutput }) => {
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
      
      // Check if we need to decode the base64 data
      let resultContent;
      let previewText = '';
      
      // Binary formats should remain base64 encoded, text formats can be decoded
      const textFormats = ['csv', 'json', 'txt', 'html'];
      const isBinaryFormat = !textFormats.includes(documentType.toLowerCase());
      
      if (decodeOutput && !isBinaryFormat && exportData) {
        try {
          // Decode base64 data for text formats
          const decodedData = Buffer.from(exportData, 'base64').toString('utf-8');
          
          // Create a preview of the data
          if (documentType.toLowerCase() === 'json') {
            try {
              const jsonData = JSON.parse(decodedData);
              previewText = JSON.stringify(jsonData, null, 2).substring(0, 1000);
            } catch (e) {
              previewText = decodedData.substring(0, 1000);
            }
          } else {
            previewText = decodedData.substring(0, 1000);
          }
          
          // Add ellipsis if data was truncated
          if (decodedData.length > 1000) {
            previewText += '\n...[truncated]';
          }
          
          logger.info('Successfully exported and decoded responses', { 
            surveyId,
            documentType,
            dataSize: decodedData.length
          });
          
          resultContent = [
            { 
              type: "text", 
              text: `Responses for survey ID ${surveyId} exported successfully as ${documentType}` 
            },
            {
              type: "text", 
              text: `Preview of exported data:\n\n${previewText}`
            }
          ];
        } catch (e) {
          // Fall back to base64 if decoding fails
          const sizeKB = Math.round(exportData.length * 0.75 / 1024);
          logger.warn('Failed to decode exported responses', { 
            surveyId,
            documentType,
            error: e instanceof Error ? e.message : String(e),
            sizeKB
          });
          resultContent = [
            { 
              type: "text", 
              text: `Responses for survey ID ${surveyId} exported successfully as ${documentType} (base64 encoded, ~${sizeKB} KB)`
            },
            {
              type: "text", 
              text: `Failed to decode base64 data: ${e instanceof Error ? e.message : String(e)}`
            }
          ];
        }
      } else {
        // Return base64 encoded data info for binary formats or when decoding is disabled
        const sizeKB = Math.round(exportData.length * 0.75 / 1024);
        logger.info('Successfully exported responses (base64 encoded)', { 
          surveyId,
          documentType,
          sizeKB
        });
        resultContent = [
          { 
            type: "text", 
            text: `Responses for survey ID ${surveyId} exported successfully as ${documentType} (base64 encoded, ~${sizeKB} KB)`
          }
        ];
      }
      
      return {
        content: resultContent.map(item => ({
          type: "text",
          text: item.text
        }))
      };
    } catch (error: any) {
      logger.error('Failed to export responses', { 
        surveyId,
        documentType,
        error: error?.message 
      });
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

logger.info("Responses tools registered!");