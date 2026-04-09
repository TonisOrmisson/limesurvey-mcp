import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';
import { ensureWriteAllowed } from '../utils/readonly-guard.js';
import { getRc2Status } from '../utils/rc2-status.js';

/**
 * Create an empty question group (for headless survey construction).
 *
 * Wraps RemoteControl add_group: returns the new group id for use with importQuestion.
 */
server.tool(
  'addGroup',
  'Creates an empty question group on a survey; returns the new group ID (use with importQuestion)',
  {
    surveyId: z.union([z.string(), z.number()]).describe('Survey ID to add the group to'),
    title: z.string().describe('Group title (shown to participants)'),
    description: z
      .string()
      .optional()
      .default('')
      .describe('Optional group description')
  },
  async ({ surveyId, title, description }) => {
    const readonly = ensureWriteAllowed('addGroup');
    if (readonly) {
      return readonly;
    }

    logger.info('Adding question group', { surveyId, title });
    try {
      const result = await limesurveyAPI.addGroup(surveyId, title, description ?? '');
      const status = getRc2Status(result);

      if (status) {
        logger.error('Failed to add group', { surveyId, title, status });
        return {
          content: [
            { type: 'text', text: `Error adding question group: ${status}` },
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ],
          isError: true
        };
      }

      logger.info('Question group created', { surveyId, result });
      const text =
        typeof result === 'number'
          ? `Question group created with ID ${result}`
          : `Question group creation returned: ${JSON.stringify(result)}`;
      return {
        content: [
          { type: 'text', text },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to add group', { surveyId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error adding question group: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Delete a question group (and its questions) from a survey.
 *
 * Wraps RemoteControl delete_group. Use for idempotent “rebuild group” scripts.
 */
server.tool(
  'deleteGroup',
  'Deletes a question group from a survey (irreversible); requires explicit confirmation',
  {
    surveyId: z.union([z.string(), z.number()]).describe('Survey ID the group belongs to'),
    groupId: z.union([z.string(), z.number()]).describe('Question group ID to delete'),
    confirmDeletion: z.literal(true).describe('Must be true to proceed')
  },
  async ({ surveyId, groupId }) => {
    const readonly = ensureWriteAllowed('deleteGroup');
    if (readonly) {
      return readonly;
    }

    logger.warn('Deleting question group', { surveyId, groupId });
    try {
      const result = await limesurveyAPI.deleteGroup(surveyId, groupId);
      const status = getRc2Status(result);

      if (status) {
        logger.error('Failed to delete group', { surveyId, groupId, status });
        return {
          content: [
            { type: 'text', text: `Error deleting question group: ${status}` },
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ],
          isError: true
        };
      }

      logger.info('Question group deleted', { surveyId, groupId, result });
      const text =
        typeof result === 'number'
          ? `Question group ${groupId} deleted (gid ${result})`
          : `Question group deletion returned: ${JSON.stringify(result)}`;
      return {
        content: [
          { type: 'text', text },
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to delete group', { surveyId, groupId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting question group: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Sets properties on a specific question group.
 *
 * Wraps the RemoteControl set_group_properties method:
 *   set_group_properties($sessionKey, $iGroupID, $aGroupData)
 */
server.tool(
  'setGroupProperties',
  'Sets properties for a specific question group',
  {
    groupId: z.union([z.string(), z.number()]).describe('The ID of the question group'),
    properties: z
      .record(z.any())
      .describe(
        'Group fields to update (see QuestionGroup attributes; sid/gid cannot be changed)'
      )
  },
  async ({ groupId, properties }) => {
    const readonly = ensureWriteAllowed('setGroupProperties');
    if (readonly) {
      return readonly;
    }

    logger.info('Setting group properties', {
      groupId,
      propertyKeys: Object.keys(properties || {})
    });

    if (!properties || Object.keys(properties).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No properties provided; please supply at least one group field to update'
          }
        ],
        isError: true
      };
    }

    try {
      const result = await limesurveyAPI.setGroupProperties(groupId, properties);
      logger.info('Group properties updated', { groupId, result });
      return {
        content: [
          {
            type: 'text',
            text: `Group ${groupId} updated successfully`
          },
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to set group properties', { groupId, error: error?.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error updating group properties: ${error?.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
);

logger.info('Group management tools registered!');
