// filepath: c:\Users\tonis\PhpstormProjects\mcp-limesurvey\src\tools\response-management.ts
import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

/**
 * Tool to add a new response to a survey
 * 
 * Corresponds to the add_response method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_add_response
 * 
 * Returns the ID of the added response
 */
server.tool(
  "addResponse",
  "Adds a new response to a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseData: z.record(z.any()).describe("The response data as an object with question codes as keys and answers as values")
  },
  async ({ surveyId, responseData }) => {
    try {
      const result = await limesurveyAPI.addResponse(surveyId, responseData);
      return {
        content: [
          { 
            type: "text", 
            text: `Response added successfully to survey ${surveyId} with ID: ${result}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error adding response: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get a specific response from a survey
 * 
 * Corresponds to the get_response method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_response
 * 
 * Returns the response data for a specific response ID
 */
server.tool(
  "getResponseById",
  "Gets data for a specific response in a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseId: z.string().describe("The ID of the response to retrieve")
  },
  async ({ surveyId, responseId }) => {
    try {
      const result = await limesurveyAPI.getResponse(surveyId, responseId);
      return {
        content: [
          { 
            type: "text", 
            text: `Response ${responseId} for survey ${surveyId} retrieved successfully` 
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
          text: `Error retrieving response: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to update an existing response in a survey
 * 
 * Corresponds to the update_response method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_update_response
 * 
 * Returns the status of the update operation
 */
server.tool(
  "updateResponse",
  "Updates an existing response in a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseId: z.string().describe("The ID of the response to update"),
    responseData: z.record(z.any()).describe("The updated response data as an object with question codes as keys and answers as values")
  },
  async ({ surveyId, responseId, responseData }) => {
    try {
      const result = await limesurveyAPI.updateResponse(surveyId, responseId, responseData);
      return {
        content: [
          { 
            type: "text", 
            text: `Response ${responseId} in survey ${surveyId} updated successfully: ${result}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error updating response: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to delete a specific response from a survey
 * 
 * Corresponds to the delete_response method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_delete_response
 * 
 * Returns the status of the delete operation
 */
server.tool(
  "deleteResponse",
  "Deletes a specific response from a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseId: z.string().describe("The ID of the response to delete")
  },
  async ({ surveyId, responseId }) => {
    try {
      const result = await limesurveyAPI.deleteResponse(surveyId, responseId);
      return {
        content: [
          { 
            type: "text", 
            text: `Response ${responseId} deleted from survey ${surveyId} successfully` 
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
          text: `Error deleting response: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to delete all responses from a survey
 * 
 * Corresponds to the delete_all_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_delete_all_responses
 * 
 * Returns the status of the delete operation
 */
server.tool(
  "deleteAllResponses",
  "Deletes all responses from a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    confirmDeletion: z.literal(true).describe("Confirmation that you want to delete all responses (must be true)")
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
      const result = await limesurveyAPI.deleteAllResponses(surveyId);
      return {
        content: [
          { 
            type: "text", 
            text: `All responses from survey ${surveyId} deleted successfully` 
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
          text: `Error deleting responses: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to import responses from a CSV file or other supported format
 * 
 * Corresponds to the import_responses method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_import_responses
 * 
 * Returns import status and information
 */
server.tool(
  "importResponses",
  "Imports responses from a base64 encoded file (CSV or other supported format)",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseData: z.string().describe("Base64 encoded file with responses"),
    importDataType: z.string().default("csv").describe("Format of the import data (default: csv)"),
    fullResponse: z.boolean().default(false).describe("Whether to import as full responses (true) or match by key fields (false)")
  },
  async ({ surveyId, responseData, importDataType, fullResponse }) => {
    try {
      const result = await limesurveyAPI.importResponses(surveyId, responseData, importDataType, fullResponse);
      return {
        content: [
          { 
            type: "text", 
            text: `Responses imported successfully to survey ${surveyId}` 
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
          text: `Error importing responses: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to set the status of a survey response
 * 
 * Corresponds to the set_response_status method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_set_response_status
 * 
 * Returns the status of the operation
 */
server.tool(
  "setResponseStatus",
  "Sets the status of a specific response in a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    responseId: z.string().describe("The ID of the response"),
    status: z.enum(['complete', 'incomplete', 'deleted']).describe("The new status to set")
  },
  async ({ surveyId, responseId, status }) => {
    try {
      const result = await limesurveyAPI.setResponseStatus(surveyId, responseId, status);
      return {
        content: [
          { 
            type: "text", 
            text: `Status of response ${responseId} in survey ${surveyId} set to "${status}" successfully: ${result}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error setting response status: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to reset survey response tables for a survey
 * 
 * Corresponds to the reset_survey_logic_file method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_reset_survey_logic_file
 * 
 * Resets the response tables for a survey (removes all responses)
 */
server.tool(
  "resetSurveyResponses",
  "Resets the response tables for a survey, removing all responses",
  {
    surveyId: z.string().describe("The ID of the survey"),
    confirmReset: z.literal(true).describe("Confirmation that you want to reset all responses (must be true)")
  },
  async ({ surveyId, confirmReset }) => {
    if (!confirmReset) {
      return {
        content: [{ 
          type: "text", 
          text: "You must confirm reset by setting confirmReset to true" 
        }],
        isError: true
      };
    }
    
    try {
      const result = await limesurveyAPI.resetSurveyResponses(surveyId);
      return {
        content: [
          { 
            type: "text", 
            text: `Response tables for survey ${surveyId} reset successfully` 
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
          text: `Error resetting survey response tables: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Response Management tools registered!");