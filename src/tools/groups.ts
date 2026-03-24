import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { formatForLLM } from '../utils/toon.js';

/**
 * Question group tools
 *
 * Wrap the LimeSurvey RemoteControl group listing and property methods.
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
            text: formatForLLM(groups)
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
 * Gets properties for a specific question group.
 *
 * Wraps the RemoteControl get_group_properties method:
 *   get_group_properties($sessionKey, $iGroupID, $aGroupSettings = null, $sLanguage = null)
 */
server.tool(
  "getGroupProperties",
  "Gets properties for a specific question group",
  {
    groupId: z.union([z.string(), z.number()]).describe("The ID of the question group"),
    properties: z
      .array(z.string())
      .optional()
      .describe("Optional: array of property names to retrieve (see QuestionGroup fields)"),
    language: z
      .string()
      .optional()
      .describe("Optional: language code for multilingual groups; defaults to survey base language")
  },
  async ({ groupId, properties, language }) => {
    logger.info('Getting group properties', {
      groupId,
      language: language || 'default',
      propertyCount: properties?.length ?? 'all'
    });

    try {
      const result = await limesurveyAPI.getGroupProperties(
        groupId,
        properties ?? null,
        language ?? null
      );

      if (
        !result ||
        (Array.isArray(result) && result.length === 0) ||
        (typeof result === 'object' && Object.keys(result).length === 0)
      ) {
        logger.info('No group properties found', { groupId });
        return {
          content: [
            {
              type: "text",
              text: `No group found with ID ${groupId}`
            }
          ]
        };
      }

      logger.info('Group properties retrieved', { groupId });
      return {
        content: [
          {
            type: "text",
            text: `Properties for group ID ${groupId} retrieved successfully`
          },
          {
            type: "text",
            text: formatForLLM(result)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get group properties', { groupId, error: error?.message });
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving group properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

logger.info("Groups tools registered!");
