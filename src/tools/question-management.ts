import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';
import { getRc2Status } from '../utils/rc2-status.js';

/**
 * Import a question from base64-encoded .lsq content into a group.
 *
 * Wraps RemoteControl import_question (same pattern as importSurvey + LSS).
 */
server.tool(
  'importQuestion',
  'Imports a question from base64-encoded .lsq data into a survey group; returns the new question ID on success',
  {
    surveyId: z.union([z.string(), z.number()]).describe('Survey ID'),
    groupId: z.union([z.string(), z.number()]).describe('Target question group ID (from addGroup or listQuestionGroups)'),
    importData: z
      .string()
      .describe('Base64-encoded .lsq file content (export one question from LimeSurvey once, then reuse as a template)'),
    importDataType: z
      .literal('lsq')
      .default('lsq')
      .describe('Import format; RemoteControl expects lsq for question import'),
    mandatory: z
      .enum(['Y', 'S', 'N'])
      .default('N')
      .describe("Whether the imported question is mandatory ('Y', 'S', or 'N')"),
    newQuestionTitle: z
      .string()
      .optional()
      .describe('Optional: override question code/title after import'),
    newQuestionText: z
      .string()
      .optional()
      .describe('Optional: override question text after import'),
    newQuestionHelp: z
      .string()
      .optional()
      .describe('Optional: override help text after import')
  },
  async ({
    surveyId,
    groupId,
    importData,
    importDataType,
    mandatory,
    newQuestionTitle,
    newQuestionText,
    newQuestionHelp
  }) => {
    const readonly = ensureWriteAllowed('importQuestion');
    if (readonly) {
      return readonly;
    }

    logger.info('Importing question', { surveyId, groupId, importDataType });
    try {
      const result = await limesurveyAPI.importQuestion(
        surveyId,
        groupId,
        importData,
        importDataType,
        mandatory,
        newQuestionTitle ?? null,
        newQuestionText ?? null,
        newQuestionHelp ?? null
      );
      const status = getRc2Status(result);

      if (status) {
        logger.error('Failed to import question', { surveyId, groupId, status });
        return {
          content: [
            { type: 'text', text: `Error importing question: ${status}` },
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ],
          isError: true
        };
      }

      logger.info('Question imported', { surveyId, groupId, result });
      const text =
        typeof result === 'number'
          ? `Question imported with ID ${result}`
          : `Question import returned: ${JSON.stringify(result)}`;
      return {
        content: [
          { type: 'text', text },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to import question', {
        surveyId,
        groupId,
        error: error?.message
      });
      return {
        content: [
          {
            type: 'text',
            text: `Error importing question: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Delete a single question from a survey.
 *
 * Wraps RemoteControl delete_question. Child rows (e.g. ranking subquestions) may
 * need separate deletes depending on LimeSurvey version—use listQuestions to inspect.
 */
server.tool(
  'deleteQuestion',
  'Deletes a question from a survey (irreversible); requires explicit confirmation',
  {
    questionId: z.union([z.string(), z.number()]).describe('Question ID (qid) to delete'),
    confirmDeletion: z.literal(true).describe('Must be true to proceed')
  },
  async ({ questionId }) => {
    const readonly = ensureWriteAllowed('deleteQuestion');
    if (readonly) {
      return readonly;
    }

    logger.warn('Deleting question', { questionId });
    try {
      const result = await limesurveyAPI.deleteQuestion(questionId);
      const status = getRc2Status(result);

      if (status) {
        logger.error('Failed to delete question', { questionId, status });
        return {
          content: [
            { type: 'text', text: `Error deleting question: ${status}` },
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ],
          isError: true
        };
      }

      logger.info('Question deleted', { questionId, result });
      const text =
        typeof result === 'number'
          ? `Question ${questionId} deleted (qid ${result})`
          : `Question deletion returned: ${JSON.stringify(result)}`;
      return {
        content: [
          { type: 'text', text },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete question', { questionId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting question: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Sets properties on a specific question.
 *
 * Wraps the RemoteControl set_question_properties method:
 *   set_question_properties($sessionKey, $iQuestionID, $aQuestionData, $sLanguage = null)
 */
server.tool(
  'setQuestionProperties',
  'Sets LimeSurvey question fields (text, help, etc.); use getQuestionProperties first. Type/gid/sid/parent_qid/language are restricted by the API.',
  {
    questionId: z.union([z.string(), z.number()]).describe('The ID of the question'),
    properties: z
      .record(z.any())
      .describe(
        'Fields to update: commonly `question` (stem HTML), `help`. Ranking/list types: parent carries the stem; rank items and list choices are often separate rows (subquestions/answers)—inspect with listQuestions + getQuestionProperties before editing.'
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
