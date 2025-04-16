// filepath: c:\Users\tonis\PhpstormProjects\mcp-limesurvey\src\tools\group-management.ts
import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

/**
 * Tool to import a question group from a base64 encoded structure file
 * 
 * Corresponds to the import_group method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_import_group
 * 
 * Returns import status and information
 */
server.tool(
  "importQuestionGroup",
  "Imports a question group from a base64 encoded structure file",
  {
    importData: z.string().describe("Base64 encoded string containing the question group structure"),
    importName: z.string().describe("The name to use for the question group after import"),
    importVersion: z.string().optional().describe("Optional: The version to use (if null, it will be auto-detected)")
  },
  async ({ importData, importName, importVersion }) => {
    try {
      const result = await limesurveyAPI.importGroup(importData, importName, importVersion || null);
      return {
        content: [
          { 
            type: "text", 
            text: `Question group imported successfully` 
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error importing question group: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to export a question group structure
 * 
 * Corresponds to the export_group method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_group
 * 
 * Returns a base64 encoded string containing the group structure
 */
server.tool(
  "exportQuestionGroup",
  "Exports a question group as a base64 encoded structure file",
  {
    surveyId: z.string().describe("The ID of the survey"),
    groupId: z.string().describe("The ID of the question group to export")
  },
  async ({ surveyId, groupId }) => {
    try {
      const result = await limesurveyAPI.exportGroup(surveyId, groupId);
      
      // Calculate size in KB for user information
      const sizeKB = Math.round(result.length * 0.75 / 1024);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Question group ${groupId} from survey ${surveyId} exported successfully. The exported file is base64 encoded and has a size of approximately ${sizeKB} KB.` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting question group: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Question Group Management tools registered!");