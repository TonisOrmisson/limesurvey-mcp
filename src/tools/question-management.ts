import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';

/**
 * Sets properties on a specific question.
 *
 * Wraps the RemoteControl set_question_properties method:
 *   set_question_properties($sessionKey, $iQuestionID, $aQuestionData, $sLanguage = null)
 */
server.tool(
  'setQuestionProperties',
  'Sets properties for a specific question',
  {
    questionId: z.union([z.string(), z.number()]).describe('The ID of the question'),
    properties: z
      .record(z.any())
      .describe(
        'Question fields to update (see Question attributes; qid/gid/sid/parent_qid/language/type are restricted)'
      ),
    language: z
      .string()
      .optional()
      .describe('Optional: language code for question texts; defaults to survey base language')
  },
  async ({ questionId, properties, language }) => {
    const readonly = ensureWriteAllowed('setQuestionProperties');
    if (readonly) {
      return readonly;
    }

    logger.info('Setting question properties', {
      questionId,
      language: language || 'default',
      propertyKeys: Object.keys(properties || {})
    });

    if (!properties || Object.keys(properties).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No properties provided; please supply at least one question field to update'
          }
        ],
        isError: true
      };
    }

    try {
      const result = await limesurveyAPI.setQuestionProperties(
        questionId,
        properties,
        language ?? null
      );
      logger.info('Question properties updated', { questionId, result });
      return {
        content: [
          {
            type: 'text',
            text: `Question ${questionId} updated successfully`
          },
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to set question properties', {
        questionId,
        error: error?.message
      });
      return {
        content: [
          {
            type: 'text',
            text: `Error updating question properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

logger.info('Question management tools registered!');
