// filepath: c:\Users\tonis\PhpstormProjects\mcp-limesurvey\src\tools\file-management.ts
import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

/**
 * Tool to upload a file to a survey
 * 
 * Corresponds to the upload_file method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_upload_file
 * 
 * Returns the relative URL to the file in the survey
 */
server.tool(
  "uploadSurveyFile",
  "Uploads a file to a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    fileData: z.string().describe("Base64 encoded file content"),
    fileName: z.string().describe("The name of the file (including extension)")
  },
  async ({ surveyId, fileData, fileName }) => {
    try {
      const result = await limesurveyAPI.uploadFile(surveyId, fileData, fileName);
      return {
        content: [
          { 
            type: "text", 
            text: `File "${fileName}" uploaded successfully to survey ${surveyId}` 
          },
          {
            type: "text",
            text: `File URL: ${result}`
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error uploading file: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get a list of uploaded files for a survey
 * 
 * Corresponds to the get_uploaded_files method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_uploaded_files
 * 
 * Returns a list of files uploaded to the survey
 */
server.tool(
  "getUploadedFiles",
  "Gets a list of files uploaded to a survey",
  {
    surveyId: z.string().describe("The ID of the survey")
  },
  async ({ surveyId }) => {
    try {
      const result = await limesurveyAPI.getUploadedFiles(surveyId);
      
      // Check if there are any files
      if (!result || (Array.isArray(result) && result.length === 0) || Object.keys(result).length === 0) {
        return {
          content: [
            { 
              type: "text", 
              text: `No files found for survey ${surveyId}` 
            }
          ]
        };
      }
      
      return {
        content: [
          { 
            type: "text", 
            text: `Files for survey ${surveyId} retrieved successfully` 
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
          text: `Error getting uploaded files: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("File Management tools registered!");