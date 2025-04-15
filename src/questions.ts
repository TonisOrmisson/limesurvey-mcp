import { z } from 'zod';
import { server } from './server.js';
import limesurveyAPI from './services/limesurvey-api.js';

/**
 * Tool to list questions for a survey
 * 
 * Corresponds to the list_questions method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_questions
 * 
 * Returns an array with all the questions in the survey
 */
server.tool(
  "listQuestions",
  "Lists all questions for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    groupId: z.string().optional().describe("The ID of the question group (optional)"),
    language: z.string().optional().describe("The language code (optional)")
  },
  async ({ surveyId, groupId = null, language = null }) => {
    try {
      const questions = await limesurveyAPI.listQuestions(surveyId, groupId, language);
      return {
        content: [
          { 
            type: "text", 
            text: `Questions for survey ID ${surveyId}${groupId ? ` and group ID ${groupId}` : ''} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(questions, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error listing questions: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to list question groups for a survey
 * 
 * Corresponds to the list_groups method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_groups
 * 
 * Returns an array with all the question groups in the survey
 */
server.tool(
  "listQuestionGroups",
  "Lists all question groups for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    language: z.string().optional().describe("The language code (optional)")
  },
  async ({ surveyId, language = null }) => {
    try {
      const groups = await limesurveyAPI.listGroups(surveyId, language);
      return {
        content: [
          { 
            type: "text", 
            text: `Question groups for survey ID ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(groups, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error listing question groups: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);