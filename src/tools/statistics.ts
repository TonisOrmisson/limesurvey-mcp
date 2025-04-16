import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

/**
 * Tool to export statistics from a survey in different formats
 * 
 * Corresponds to the export_statistics method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_statistics
 * 
 * This allows exporting the available statistics for a survey in PDF, Excel, or HTML format,
 * optionally with graphs and filtering by question groups.
 * 
 * Returns a base64 encoded string containing the statistics file.
 */
server.tool(
  "exportStatistics",
  "Exports survey statistics in PDF, Excel, or HTML format with optional graphs",
  {
    surveyId: z.string().describe("The ID of the survey to export statistics for"),
    documentType: z.enum(['pdf', 'xls', 'html']).default('pdf').describe("Format of the export: 'pdf', 'xls', or 'html'"),
    language: z.string().optional().describe("Optional: Language for statistics export (default: survey's default language)"),
    includeGraphs: z.boolean().default(false).describe("Whether to include graphs in the export (only applicable for PDF)"),
    groupIds: z.union([
      z.number(),
      z.array(z.number())
    ]).optional().describe("Optional: Specific question group ID(s) to include in statistics")
  },
  async ({ surveyId, documentType, language, includeGraphs, groupIds }) => {
    try {
      // Convert boolean to string as expected by the LimeSurvey API
      const graphOption = includeGraphs ? '1' : '0';
      
      const exportData = await limesurveyAPI.exportStatistics(
        surveyId,
        documentType,
        language || null,
        graphOption,
        groupIds || null
      );
      
      // The response is already base64 encoded
      const fileExtension = documentType === 'pdf' ? 'pdf' : 
                           documentType === 'xls' ? 'xls' : 'html';
      
      // For HTML we can show a preview, for other formats we just confirm the data was received
      let previewText = '';
      
      if (documentType === 'html') {
        try {
          // Try to decode a portion of the HTML to show as preview
          const decodedHtml = Buffer.from(exportData, 'base64').toString('utf-8');
          previewText = `\nHTML Preview (first 300 characters):\n${decodedHtml.substring(0, 300)}...`;
        } catch (e) {
          previewText = "\nUnable to generate HTML preview.";
        }
      } else {
        previewText = `\nThe ${fileExtension.toUpperCase()} file was successfully generated.`;
      }
      
      return {
        content: [
          { 
            type: "text", 
            text: `Statistics for survey ID ${surveyId} exported successfully as ${documentType.toUpperCase()}${includeGraphs ? ' with graphs' : ''}.` 
          },
          {
            type: "text", 
            text: `The exported statistics file is base64 encoded and has a size of approximately ${Math.round(exportData.length * 0.75 / 1024)} KB.${previewText}`
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting statistics: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Statistics tools registered!");