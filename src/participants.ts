import { z } from 'zod';
import { server } from './server.js';
import limesurveyAPI from './services/limesurvey-api.js';

/**
 * Tool to add a participant to a survey
 * 
 * Corresponds to the add_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_add_participants
 * 
 * Returns the result of adding the participant, including token information
 */
server.tool(
  "addSurveyParticipant",
  "Adds a new participant to a survey and optionally creates a token",
  {
    surveyId: z.string().describe("The ID of the survey"),
    email: z.string().email().describe("Email of the participant"),
    firstname: z.string().optional().describe("First name of the participant"),
    lastname: z.string().optional().describe("Last name of the participant"),
    createToken: z.boolean().default(true).describe("Whether to create a token for the participant")
  },
  async ({ surveyId, email, firstname = "", lastname = "", createToken = true }) => {
    try {
      const participantData = {
        email,
        firstname,
        lastname
      };
      
      const result = await limesurveyAPI.addParticipant(surveyId, participantData, createToken);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Participant ${email} added to survey ID ${surveyId} successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
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
 * Tool to get participant properties
 * 
 * Corresponds to the get_participant_properties method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_participant_properties
 * 
 * Returns properties of a participant (token) in a survey
 */
server.tool(
  "getParticipantProperties",
  "Gets properties of a participant (token) in a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    tokenId: z.string().describe("The token ID or participant ID"),
    attributes: z.array(z.string()).optional().describe("Optional array of attribute names to get")
  },
  async ({ surveyId, tokenId, attributes = null }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const properties = await limesurveyAPI.request(
        'get_participant_properties', 
        [key, surveyId, tokenId, attributes]
      );
      
      return {
        content: [
          { 
            type: "text", 
            text: `Properties for participant ID ${tokenId} in survey ID ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(properties, null, 2)
          }
        ]
      };
    } catch (error: any) {
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
 * Tool to list participants in a survey
 * 
 * Corresponds to the list_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_participants
 * 
 * Returns a list of participants for a survey
 */
server.tool(
  "listSurveyParticipants",
  "Lists participants (tokens) for a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    start: z.number().default(0).describe("Start index"),
    limit: z.number().default(10).describe("Number of participants to return"),
    unused: z.boolean().optional().describe("Return only unused tokens"),
    attributes: z.array(z.string()).optional().describe("Optional array of attribute names to get"),
    conditions: z.record(z.string()).optional().describe("Optional conditions for filtering participants")
  },
  async ({ surveyId, start = 0, limit = 10, unused = null, attributes = null, conditions = null }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const participants = await limesurveyAPI.request(
        'list_participants', 
        [key, surveyId, start, limit, unused, attributes, conditions]
      );
      
      return {
        content: [
          { 
            type: "text", 
            text: `Participants for survey ID ${surveyId} retrieved successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(participants, null, 2)
          }
        ]
      };
    } catch (error: any) {
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
 * Tool to delete participants from a survey
 * 
 * Corresponds to the delete_participants method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_delete_participants
 * 
 * Deletes participants (tokens) from a survey
 */
server.tool(
  "deleteParticipants",
  "Deletes participants (tokens) from a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    tokens: z.array(z.string()).describe("Array of token IDs to delete")
  },
  async ({ surveyId, tokens }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const result = await limesurveyAPI.request(
        'delete_participants', 
        [key, surveyId, tokens]
      );
      
      return {
        content: [
          { 
            type: "text", 
            text: `Participants deleted from survey ID ${surveyId} successfully` 
          },
          {
            type: "text", 
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
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