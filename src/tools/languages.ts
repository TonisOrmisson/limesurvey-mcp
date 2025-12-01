import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';

/**
 * Adds an additional language to a survey.
 *
 * Wraps the add_language RemoteControl method.
 */
server.tool(
  'addSurveyLanguage',
  'Adds a new language to a survey',
  {
    surveyId: z.string().describe('The ID of the survey'),
    language: z.string().describe('Language code to add (e.g. "de", "fr")')
  },
  async ({ surveyId, language }) => {
    const readonly = ensureWriteAllowed('addSurveyLanguage');
    if (readonly) {
      return readonly;
    }

    logger.info('Adding survey language', { surveyId, language });
    try {
      const result = await limesurveyAPI.addLanguage(surveyId, language);
      logger.info('Survey language added', { surveyId, language, result });
      return {
        content: [
          { type: 'text', text: `Language ${language} added to survey ${surveyId}` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to add survey language', { surveyId, language, error: error?.message });
      return {
        content: [
          { type: 'text', text: `Error adding survey language: ${error?.message || 'Unknown error'}` }
        ],
        isError: true
      };
    }
  }
);

/**
 * Deletes an existing language from a survey.
 *
 * Wraps the delete_language RemoteControl method.
 */
server.tool(
  'deleteSurveyLanguage',
  'Deletes a language from a survey',
  {
    surveyId: z.string().describe('The ID of the survey'),
    language: z.string().describe('Language code to remove'),
    confirmDeletion: z.literal(true).describe('Must be true to delete this language')
  },
  async ({ surveyId, language }) => {
    const readonly = ensureWriteAllowed('deleteSurveyLanguage');
    if (readonly) {
      return readonly;
    }

    logger.warn('Deleting survey language', { surveyId, language });
    try {
      const result = await limesurveyAPI.deleteLanguage(surveyId, language);
      logger.info('Survey language deleted', { surveyId, language, result });
      return {
        content: [
          { type: 'text', text: `Language ${language} deleted from survey ${surveyId}` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete survey language', { surveyId, language, error: error?.message });
      return {
        content: [
          { type: 'text', text: `Error deleting survey language: ${error?.message || 'Unknown error'}` }
        ],
        isError: true
      };
    }
  }
);

/**
 * Sets language-specific properties for a survey language.
 *
 * Wraps the set_language_properties RemoteControl method.
 */
server.tool(
  'setSurveyLanguageProperties',
  'Sets language-specific properties for a survey',
  {
    surveyId: z.string().describe('The ID of the survey'),
    language: z
      .string()
      .optional()
      .describe('Language code; omit to target the base language'),
    localeData: z
      .record(z.any())
      .describe(
        'Locale fields to update (e.g. surveyls_title, surveyls_description, surveyls_welcometext, etc.)'
      )
  },
  async ({ surveyId, language, localeData }) => {
    const readonly = ensureWriteAllowed('setSurveyLanguageProperties');
    if (readonly) {
      return readonly;
    }

    logger.info('Setting survey language properties', {
      surveyId,
      language: language || 'base',
      localeKeys: Object.keys(localeData || {})
    });

    if (!localeData || Object.keys(localeData).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No localeData provided; please supply at least one language property to update'
          }
        ],
        isError: true
      };
    }

    try {
      const result = await limesurveyAPI.setLanguageProperties(
        surveyId,
        localeData,
        language ?? null
      );
      logger.info('Survey language properties updated', {
        surveyId,
        language: language || 'base',
        result
      });
      return {
        content: [
          {
            type: 'text',
            text: `Language properties updated for survey ${surveyId} (${language || 'base language'})`
          },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to set survey language properties', {
        surveyId,
        language,
        error: error?.message
      });
      return {
        content: [
          {
            type: 'text',
            text: `Error updating survey language properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

logger.info('Language tools registered!');
