import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

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
