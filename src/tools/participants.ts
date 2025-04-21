import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to add a participant to a survey
 * 
 * Corresponds to the add_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_add_participants
 * 
 * Adds a participant to a survey and returns the participant data with token
 */
server.tool(
  "addParticipant", 
  "Adds a participant to a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    email: z.string().email().describe("Participant email address"),
    firstName: z.string().optional().describe("Optional: First name"),
    lastName: z.string().optional().describe("Optional: Last name"),
    language: z.string().optional().describe("Optional: Language code"),
    usesLeft: z.number().default(1).describe("Number of times the participant can access the survey"),
    validFrom: z.string().optional().describe("Optional: Valid from date (YYYY-MM-DD HH:mm:ss)"),
    validUntil: z.string().optional().describe("Optional: Valid until date (YYYY-MM-DD HH:mm:ss)")
  },
  async ({ surveyId, email, firstName, lastName, language, usesLeft, validFrom, validUntil }) => {
    logger.info('Adding participant to survey', { surveyId, email });
    try {
      // Create participant data object
      const participantData: Record<string, any> = {
        email: email
      };
      
      // Add optional properties if provided
      if (firstName) participantData.firstname = firstName;
      if (lastName) participantData.lastname = lastName;
      if (language) participantData.language = language;
      if (usesLeft !== undefined) participantData.usesleft = usesLeft;
      if (validFrom) participantData.validfrom = validFrom;
      if (validUntil) participantData.validuntil = validUntil;
      
      const result = await limesurveyAPI.addParticipant(surveyId, participantData);
      logger.info('Successfully added participant', { surveyId, email, token: result?.token });
      return {
        content: [
          { 
            type: "text", 
            text: `Participant added to survey ID ${surveyId} successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to add participant', { surveyId, email, error: error?.message });
      return {
        content: [{ 
          type: "text", 
          text: `Error adding participant: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to list participants in a survey
 * 
 * Corresponds to the list_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_participants
 * 
 * Lists participants for a specific survey
 */
server.tool(
  "listParticipants",
  "Lists participants for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    start: z.number().default(0).describe("Starting participant index"),
    limit: z.number().default(10).describe("Number of participants to return"),
    unused: z.boolean().default(false).describe("Only show unused tokens"),
    attributes: z.array(z.string()).optional().describe("Optional: Array of attribute names to include")
  },
  async ({ surveyId, start, limit, unused, attributes }) => {
    logger.info('Listing participants', { surveyId, start, limit, unused });
    try {
      const key = await limesurveyAPI.getSessionKey();
      const participants = await limesurveyAPI.request(
        'list_participants', 
        [key, surveyId, start, limit, unused, attributes || false]
      );
      logger.info('Successfully retrieved participants', { 
        surveyId, 
        count: Array.isArray(participants) ? participants.length : 0 
      });
      return {
        content: [
          { 
            type: "text", 
            text: `Participants for survey ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(participants, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to list participants', { surveyId, error: error?.message });
      return {
        content: [{ 
          type: "text", 
          text: `Error listing participants: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get participant properties
 * 
 * Corresponds to the get_participant_properties method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_participant_properties
 * 
 * Returns properties of a single participant/token
 */
server.tool(
  "getParticipantProperties",
  "Gets properties of a specific participant/token",
  {
    surveyId: z.string().describe("The ID of the survey"),
    tokenId: z.string().describe("The token ID"),
    attributes: z.array(z.string()).optional().describe("Optional: Array of attribute names to include")
  },
  async ({ surveyId, tokenId, attributes }) => {
    logger.info('Getting participant properties', { surveyId, tokenId });
    try {
      const key = await limesurveyAPI.getSessionKey();
      const properties = await limesurveyAPI.request(
        'get_participant_properties', 
        [key, surveyId, tokenId, attributes || null]
      );
      logger.info('Successfully retrieved participant properties', { surveyId, tokenId });
      return {
        content: [
          { 
            type: "text", 
            text: `Properties for participant token ${tokenId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(properties, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get participant properties', { surveyId, tokenId, error: error?.message });
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving participant properties: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to add multiple participants to a survey at once
 * 
 * Corresponds to the add_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_add_participants
 * 
 * Returns information about the added participants
 */
server.tool(
    "addMultipleParticipants",
    "Adds multiple participants to a survey in one operation",
    {
      surveyId: z.string().describe("The ID of the survey"),
      participants: z.array(z.object({
        email: z.string().email().describe("Participant email address"),
        firstname: z.string().optional().describe("First name"),
        lastname: z.string().optional().describe("Last name"),
        language: z.string().optional().describe("Language code"),
        usesleft: z.number().optional().describe("Number of times the participant can access the survey"),
        validfrom: z.string().optional().describe("Valid from date (YYYY-MM-DD HH:mm:ss)"),
        validuntil: z.string().optional().describe("Valid until date (YYYY-MM-DD HH:mm:ss)")
      })).describe("Array of participant data objects"),
      createToken: z.boolean().default(true).describe("Whether to create tokens (default: true)")
    },
    async ({ surveyId, participants, createToken }) => {
      logger.info('Adding multiple participants', { 
        surveyId, 
        participantCount: participants.length,
        createToken 
      });
      try {
        const result = await limesurveyAPI.addParticipants(surveyId, participants, createToken);
        logger.info('Successfully added multiple participants', { 
          surveyId, 
          addedCount: result.length 
        });
        return {
          content: [
            { 
              type: "text", 
              text: `${result.length} participants added to survey ID ${surveyId} successfully` 
            },
            {
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error('Failed to add multiple participants', { 
          surveyId, 
          participantCount: participants.length,
          error: error?.message 
        });
        return {
          content: [{ 
            type: "text", 
            text: `Error adding participants: ${error?.message || 'Unknown error'}` 
          }],
          isError: true
        };
      }
    }
  );
  
  /**
   * Tool to list survey participants with advanced filtering options
   * 
   * Corresponds to the list_participants method in LimeSurvey Remote API with additional parameters
   * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_participants
   * 
   * Lists participants with pagination and filtering options
   */
  server.tool(
    "listFilteredParticipants",
    "Lists survey participants with advanced filtering options",
    {
      surveyId: z.string().describe("The ID of the survey"),
      start: z.number().default(0).describe("Starting participant index"),
      limit: z.number().default(10).describe("Number of participants to return"),
      unused: z.boolean().default(false).describe("Only show unused tokens"),
      attributes: z.array(z.string()).optional().describe("Optional: Array of attribute names to include"),
      conditions: z.record(z.any()).optional().describe("Optional: Filter conditions (field name as key, value to filter by as value)")
    },
    async ({ surveyId, start, limit, unused, attributes, conditions }) => {
      logger.info('Listing filtered participants', { 
        surveyId, 
        start, 
        limit, 
        unused,
        conditions 
      });
      try {
        const participants = await limesurveyAPI.listParticipants(
          surveyId, 
          start, 
          limit, 
          unused, 
          attributes || false,
          conditions || {}
        );
        
        const countParticipants = Array.isArray(participants) ? participants.length : 0;
        logger.info('Successfully retrieved filtered participants', { 
          surveyId, 
          count: countParticipants 
        });
        
        return {
          content: [
            { 
              type: "text", 
              text: `Retrieved ${countParticipants} participants for survey ${surveyId}` 
            },
            {
              type: "text", 
              text: JSON.stringify(participants, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error('Failed to list filtered participants', { 
          surveyId, 
          error: error?.message 
        });
        return {
          content: [{ 
            type: "text", 
            text: `Error listing participants: ${error?.message || 'Unknown error'}` 
          }],
          isError: true
        };
      }
    }
  );
  
  /**
   * Tool to delete one or more participants from a survey
   * 
   * Corresponds to the delete_participants method in LimeSurvey Remote API
   * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_delete_participants
   * 
   * Returns the status of the delete operation
   */
  server.tool(
    "deleteParticipants",
    "Deletes one or more participants from a survey",
    {
      surveyId: z.string().describe("The ID of the survey"),
      tokens: z.array(z.string()).describe("Array of token IDs to delete"),
      confirmDeletion: z.literal(true).describe("Confirmation that you want to delete the participants (must be true)")
    },
    async ({ surveyId, tokens, confirmDeletion }) => {
      logger.info('Attempting to delete participants', { 
        surveyId, 
        tokenCount: tokens.length 
      });
      
      if (!confirmDeletion) {
        logger.warn('Deletion not confirmed', { surveyId, tokenCount: tokens.length });
        return {
          content: [{ 
            type: "text", 
            text: "You must confirm deletion by setting confirmDeletion to true" 
          }],
          isError: true
        };
      }
      
      try {
        const result = await limesurveyAPI.deleteParticipants(surveyId, tokens);
        logger.info('Successfully deleted participants', { 
          surveyId, 
          tokenCount: tokens.length 
        });
        return {
          content: [
            { 
              type: "text", 
              text: `${tokens.length} participants deleted from survey ${surveyId}` 
            },
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error('Failed to delete participants', { 
          surveyId, 
          tokenCount: tokens.length,
          error: error?.message 
        });
        return {
          content: [{ 
            type: "text", 
            text: `Error deleting participants: ${error?.message || 'Unknown error'}` 
          }],
          isError: true
        };
      }
    }
  );
  
logger.info("Participants tools registered!");