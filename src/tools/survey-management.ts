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

// Export survey structure (LSS)
server.tool(
  'exportSurveyStructure',
  'Exports a survey structure as base64 LSS (optionally decoded preview)',
  {
    surveyId: z.string().describe('Survey ID to export'),
    decodePreview: z.boolean().default(false).describe('If true, return first 1000 chars decoded for quick view')
  },
  async ({ surveyId, decodePreview }) => {
    try {
      const data = await limesurveyAPI.exportSurveyStructure(surveyId);
      if (!decodePreview) {
        const sizeKB = Math.round(data.length * 0.75 / 1024);
        return {
          content: [{ type: 'text', text: `Exported survey ${surveyId} (base64 LSS, ~${sizeKB} KB)` }]
        };
      }

      const decoded = Buffer.from(data, 'base64').toString('utf-8');
      const preview = decoded.substring(0, 1000) + (decoded.length > 1000 ? '\n...[truncated]' : '');
      return {
        content: [
          { type: 'text', text: `Exported survey ${surveyId} (base64 LSS)` },
          { type: 'text', text: `Preview (decoded):\n${preview}` }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to export survey', { surveyId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error exporting survey: ${error?.message || 'Unknown error'}` }],
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
