import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

/**
 * Question group tools
 *
 * Wraps the LimeSurvey RemoteControl `list_groups` method.
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

logger.info("Groups tools registered!");

