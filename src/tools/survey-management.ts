// filepath: c:\Users\tonis\PhpstormProjects\mcp-limesurvey\src\tools\survey-management.ts
import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

/**
 * Tool to import a survey from a .lss file (LimeSurvey Survey File)
 * 
 * Corresponds to the import_survey method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_import_survey
 * 
 * Returns the new survey ID if successful
 */
server.tool(
  "importSurvey",
  "Imports a survey from a base64 encoded .lss file",
  {
    surveyFile: z.string().describe("Base64 encoded string containing the survey structure (.lss file)"),
    surveyName: z.string().describe("The name to use for the survey after import"),
    ownerId: z.number().optional().describe("Optional: The owner ID for the survey")
  },
  async ({ surveyFile, surveyName, ownerId }) => {
    try {
      const result = await limesurveyAPI.importSurvey(surveyFile, surveyName, ownerId || null);
      return {
        content: [
          { 
            type: "text", 
            text: `Survey imported successfully with ID: ${result}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error importing survey: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to export a survey structure as .lss file
 * 
 * Corresponds to the export_survey method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_export_survey
 * 
 * Returns a base64 encoded string containing the survey structure
 */
server.tool(
  "exportSurvey",
  "Exports a survey structure as a base64 encoded .lss file",
  {
    surveyId: z.string().describe("The ID of the survey to export")
  },
  async ({ surveyId }) => {
    try {
      const result = await limesurveyAPI.exportSurveyStructure(surveyId);
      
      // Calculate size in KB for user information
      const sizeKB = Math.round(result.length * 0.75 / 1024);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Survey ${surveyId} exported successfully. The exported .lss file is base64 encoded and has a size of approximately ${sizeKB} KB.` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting survey: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to copy a survey
 * 
 * Corresponds to the copy_survey method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_copy_survey
 * 
 * Returns the ID of the copied survey
 */
server.tool(
  "copySurvey",
  "Creates a copy of an existing survey",
  {
    surveyId: z.string().describe("The ID of the survey to copy"),
    newName: z.string().optional().describe("Optional: The name of the new survey (leave empty to use original name)")
  },
  async ({ surveyId, newName }) => {
    try {
      const result = await limesurveyAPI.copySurvey(surveyId, newName || null);
      return {
        content: [
          { 
            type: "text", 
            text: `Survey ${surveyId} copied successfully. New survey ID: ${result}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error copying survey: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to delete a survey
 * 
 * Corresponds to the delete_survey method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_delete_survey
 * 
 * Completely removes a survey and all its data
 */
server.tool(
  "deleteSurvey",
  "Permanently deletes a survey and all its data",
  {
    surveyId: z.string().describe("The ID of the survey to delete"),
    confirmDeletion: z.literal(true).describe("Confirmation that you want to delete the survey (must be true)")
  },
  async ({ surveyId, confirmDeletion }) => {
    if (!confirmDeletion) {
      return {
        content: [{ 
          type: "text", 
          text: "You must confirm deletion by setting confirmDeletion to true" 
        }],
        isError: true
      };
    }
    
    try {
      const result = await limesurveyAPI.deleteSurvey(surveyId);
      return {
        content: [
          { 
            type: "text", 
            text: `Survey ${surveyId} deleted successfully` 
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
          text: `Error deleting survey: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get a questionnaire definition in JSON format
 * 
 * Corresponds to the get_questionnaire_definition method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_questionnaire_definition
 * 
 * Returns a complete questionnaire definition for a survey, including questions, groups, and settings
 */
server.tool(
  "getQuestionnaireDefinition",
  "Gets a complete questionnaire definition for a survey in JSON format",
  {
    surveyId: z.string().describe("The ID of the survey"),
    language: z.string().optional().describe("Optional: Language code (if null, uses the base language)"),
    includeTokens: z.boolean().default(false).describe("Whether to include tokens")
  },
  async ({ surveyId, language, includeTokens }) => {
    try {
      const result = await limesurveyAPI.getQuestionnaireDefinition(surveyId, language || null, includeTokens);
      return {
        content: [
          { 
            type: "text", 
            text: `Questionnaire definition for survey ${surveyId} retrieved successfully` 
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
          text: `Error retrieving questionnaire definition: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Survey Management tools registered!");