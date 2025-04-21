import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to list all questions for a survey in LimeSurvey
 * 
 * Corresponds to the list_questions method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_questions
 * 
 * Returns an array of all questions for a specific survey
 */
server.tool(
  "listQuestions", 
  "Lists all questions for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    groupId: z.string().optional().describe("Optional: Get only questions from this group"),
    language: z.string().optional().describe("Optional: Language for question texts")
  },
  async ({ surveyId, groupId, language }) => {
    logger.info('Listing questions', { 
      surveyId, 
      groupId: groupId || 'all',
      language: language || 'default'
    });
    try {
      const questions = await limesurveyAPI.listQuestions(surveyId, groupId || null, language || null);
      logger.info('Successfully retrieved questions', { 
        surveyId, 
        questionCount: Array.isArray(questions) ? questions.length : 0 
      });
      return {
        content: [
          { 
            type: "text", 
            text: `Questions for survey ID ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(questions, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to list questions', { 
        surveyId, 
        groupId: groupId || 'all',
        error: error?.message 
      });
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
 * Tool to list all question groups for a survey in LimeSurvey
 * 
 * Corresponds to the list_groups method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_groups
 * 
 * Returns an array of all question groups for a specific survey
 */
server.tool(
  "listQuestionGroups", 
  "Lists all question groups for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    language: z.string().optional().describe("Optional: Language for group texts")
  },
  async ({ surveyId, language }) => {
    logger.info('Listing question groups', { 
      surveyId, 
      language: language || 'default'
    });
    try {
      const groups = await limesurveyAPI.listGroups(surveyId, language || null);
      logger.info('Successfully retrieved question groups', { 
        surveyId, 
        groupCount: Array.isArray(groups) ? groups.length : 0 
      });
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
      logger.error('Failed to list question groups', { 
        surveyId, 
        error: error?.message 
      });
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

/**
 * Tool to get question properties
 * 
 * Corresponds to the get_question_properties method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_question_properties
 * 
 * Returns properties for a specific question
 */
server.tool(
  "getQuestionProperties",
  "Gets properties for a specific question",
  {
    questionId: z.string().describe("The ID of the question"),
    language: z.string().optional().describe("Optional: Language for question texts"),
    properties: z.array(z.string()).optional().describe("Optional: Array of property names to retrieve")
  },
  async ({ questionId, language, properties }) => {
    logger.info('Getting question properties', { 
      questionId,
      language: language || 'default',
      propertyCount: properties?.length || 'all'
    });
    try {
      const key = await limesurveyAPI.getSessionKey();
      const questionProperties = await limesurveyAPI.request(
        'get_question_properties', 
        [key, questionId, language || null, properties || null]
      );
      logger.info('Successfully retrieved question properties', { 
        questionId,
        propertyCount: Object.keys(questionProperties || {}).length
      });
      return {
        content: [
          { 
            type: "text", 
            text: `Properties for question ID ${questionId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(questionProperties, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get question properties', { 
        questionId,
        error: error?.message 
      });
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving question properties: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

logger.info("Questions tools registered!");