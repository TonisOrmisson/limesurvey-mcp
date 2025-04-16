import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';

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
    try {
      const key = await limesurveyAPI.getSessionKey();
      const participants = await limesurveyAPI.request(
        'list_participants', 
        [key, surveyId, start, limit, unused, attributes || false]
      );
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
    try {
      const key = await limesurveyAPI.getSessionKey();
      const properties = await limesurveyAPI.request(
        'get_participant_properties', 
        [key, surveyId, tokenId, attributes || null]
      );
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

console.log("Participants tools registered!");