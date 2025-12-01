import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

// Add a new (empty) survey
server.tool(
  'addSurvey',
  'Creates a new empty survey with the given title/language',
  {
    title: z.string().describe('Survey title'),
    language: z.string().default('en').describe('Base language code'),
    format: z.enum(['A', 'G', 'S']).default('G').describe("Question display format: 'A'll, 'G'roup, 'S'ingle")
  },
  async ({ title, language, format }) => {
    logger.info('Creating survey', { title, language, format });
    try {
      const surveyId = await limesurveyAPI.addSurvey(title, language, format);
      logger.info('Survey created', { surveyId });
      return {
        content: [{ type: 'text', text: `Survey created with ID ${surveyId}` }]
      };
    } catch (error: any) {
      logger.error('Failed to create survey', { title, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error creating survey: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Import survey from base64 LSS archive
server.tool(
  'importSurvey',
  'Imports a survey from a base64-encoded LSS archive',
  {
    surveyFileBase64: z.string().describe('Base64-encoded LSS archive'),
    importName: z.string().describe('Name to use for the imported survey'),
    ownerId: z.number().optional().describe('Optional owner user ID')
  },
  async ({ surveyFileBase64, importName, ownerId }) => {
    logger.info('Importing survey', { importName, ownerId });
    try {
      const surveyId = await limesurveyAPI.importSurvey(surveyFileBase64, importName, ownerId ?? null);
      logger.info('Survey imported', { surveyId });
      return {
        content: [{ type: 'text', text: `Survey imported as ID ${surveyId}` }]
      };
    } catch (error: any) {
      logger.error('Failed to import survey', { importName, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error importing survey: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Copy survey
server.tool(
  'copySurvey',
  'Copies an existing survey into a new one',
  {
    surveyId: z.string().describe('Source survey ID'),
    newName: z.string().optional().describe('Optional new survey name')
  },
  async ({ surveyId, newName }) => {
    logger.info('Copying survey', { surveyId, newName });
    try {
      const rawResult = await limesurveyAPI.copySurvey(surveyId, newName || null);
      const newId = typeof rawResult === 'object'
        ? (rawResult as any).newsid ?? (rawResult as any).id ?? (rawResult as any).sid ?? JSON.stringify(rawResult)
        : rawResult;
      logger.info('Survey copied', { from: surveyId, to: newId });
      return {
        content: [{ type: 'text', text: `Survey ${surveyId} copied to new survey ID ${newId}` }]
      };
    } catch (error: any) {
      logger.error('Failed to copy survey', { surveyId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error copying survey: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Delete survey
server.tool(
  'deleteSurvey',
  'Deletes a survey (irreversible)',
  {
    surveyId: z.string().describe('Survey ID to delete'),
    confirmDeletion: z.literal(true).describe('Must be true to proceed')
  },
  async ({ surveyId }) => {
    logger.warn('Deleting survey', { surveyId });
    try {
      const result = await limesurveyAPI.deleteSurvey(surveyId);
      return {
        content: [
          { type: 'text', text: `Survey ${surveyId} deleted` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete survey', { surveyId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error deleting survey: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Activate token table for a survey
server.tool(
  'activateTokens',
  'Creates/activates the token table for a survey',
  {
    surveyId: z.string().describe('Survey ID to activate tokens for')
  },
  async ({ surveyId }) => {
    logger.info('Activating tokens', { surveyId });
    try {
      const result = await limesurveyAPI.activateTokens(surveyId);
      return {
        content: [
          { type: 'text', text: `Tokens activated for survey ${surveyId}` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to activate tokens', { surveyId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error activating tokens: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Set survey properties
server.tool(
  'setSurveyProperties',
  'Sets properties for a survey using the set_survey_properties RemoteControl method',
  {
    surveyId: z.string().describe('Survey ID whose properties to update'),
    properties: z
      .record(z.any())
      .describe(
        'Survey fields to update (see Survey attributes; sid/active/language/additional_languages and some fields on active surveys are restricted by LS)'
      )
  },
  async ({ surveyId, properties }) => {
    logger.info('Setting survey properties', {
      surveyId,
      propertyKeys: Object.keys(properties || {})
    });

    if (!properties || Object.keys(properties).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No properties provided; please supply at least one survey field to update'
          }
        ],
        isError: true
      };
    }

    try {
      const result = await limesurveyAPI.setSurveyProperties(surveyId, properties);
      logger.info('Survey properties updated', { surveyId, result });
      return {
        content: [
          {
            type: 'text',
            text: `Survey ${surveyId} properties updated`
          },
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to set survey properties', { surveyId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error setting survey properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);
