import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';

/**
 * Adds a new quota to a survey.
 *
 * Thin wrapper around the LimeSurvey add_quota RemoteControl method.
 * For advanced options (messages, URLs, actions), call setQuotaProperties
 * after creating the quota.
 */
server.tool(
  'addQuota',
  'Adds a new quota to a survey',
  {
    surveyId: z.string().describe('The ID of the survey'),
    name: z.string().describe('Quota name'),
    limit: z.number().int().nonnegative().describe('Maximum number of responses for this quota')
  },
  async ({ surveyId, name, limit }) => {
    const readonly = ensureWriteAllowed('addQuota');
    if (readonly) {
      return readonly;
    }

    logger.info('Adding quota', { surveyId, name, limit });
    try {
      const result = await limesurveyAPI.addQuota(surveyId, name, limit);
      logger.info('Quota added', { surveyId, name, limit, result });
      return {
        content: [
          { type: 'text', text: `Quota "${name}" added to survey ${surveyId} with limit ${limit}` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to add quota', { surveyId, name, limit, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error adding quota: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Gets properties of a specific quota.
 *
 * Wraps the `get_quota_properties` RemoteControl method:
 *   get_quota_properties($sessionKey, $iQuotaId, $aQuotaSettings = null, $sLanguage = null)
 */
server.tool(
  'getQuotaProperties',
  'Gets properties for a specific quota',
  {
    quotaId: z.union([z.string(), z.number()]).describe('The ID of the quota'),
    language: z.string().optional().describe('Optional: language code for quota texts')
  },
  async ({ quotaId, language }) => {
    logger.info('Getting quota properties', { quotaId, language });
    try {
      const result = await limesurveyAPI.getQuotaProperties(quotaId, language || null);

      if (
        !result ||
        (Array.isArray(result) && result.length === 0) ||
        (typeof result === 'object' && Object.keys(result).length === 0)
      ) {
        logger.info('No quota properties found', { quotaId });
        return {
          content: [
            {
              type: 'text',
              text: `No quota found with ID ${quotaId}`
            }
          ]
        };
      }

      logger.info('Quota properties retrieved', { quotaId });
      return {
        content: [
          { type: 'text', text: `Quota properties for ID ${quotaId} retrieved successfully` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get quota properties', { quotaId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving quota properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Updates properties of an existing quota.
 *
 * Wraps the set_quota_properties RemoteControl method.
 */
server.tool(
  'setQuotaProperties',
  'Updates properties of an existing quota',
  {
    quotaId: z.string().describe('The ID of the quota to update'),
    properties: z
      .record(z.any())
      .describe(
        'Quota fields to update (e.g. name, limit, active, action, message, url, url_description, url_icon)'
      )
  },
  async ({ quotaId, properties }) => {
    const readonly = ensureWriteAllowed('setQuotaProperties');
    if (readonly) {
      return readonly;
    }

    logger.info('Setting quota properties', { quotaId, propertiesKeys: Object.keys(properties || {}) });

    if (!properties || Object.keys(properties).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No properties provided to update quota; please supply at least one field'
          }
        ],
        isError: true
      };
    }

    try {
      const result = await limesurveyAPI.setQuotaProperties(quotaId, properties);
      logger.info('Quota properties updated', { quotaId, result });
      return {
        content: [
          { type: 'text', text: `Quota ${quotaId} updated successfully` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to set quota properties', { quotaId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error updating quota: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

/**
 * Deletes an existing quota.
 *
 * Wraps the delete_quota RemoteControl method.
 */
server.tool(
  'deleteQuota',
  'Deletes a quota from a survey',
  {
    quotaId: z.string().describe('The ID of the quota to delete'),
    confirmDeletion: z.literal(true).describe('Must be true to delete this quota')
  },
  async ({ quotaId }) => {
    const readonly = ensureWriteAllowed('deleteQuota');
    if (readonly) {
      return readonly;
    }

    logger.warn('Deleting quota', { quotaId });
    try {
      const result = await limesurveyAPI.deleteQuota(quotaId);
      logger.info('Quota deleted', { quotaId, result });
      return {
        content: [
          { type: 'text', text: `Quota ${quotaId} deleted` },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete quota', { quotaId, error: error?.message });
      return {
        content: [{ type: 'text', text: `Error deleting quota: ${error?.message || 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

logger.info('Quota tools registered!');
