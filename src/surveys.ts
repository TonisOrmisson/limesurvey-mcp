import { z } from 'zod';
import { server } from './server.js';
import limesurveyAPI from './services/limesurvey-api.js';

/**
 * Tool to list all surveys in LimeSurvey
 * 
 * Corresponds to the list_surveys method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_surveys
 * 
 * Returns an array of all surveys that the authenticated user has permission to access
 * Each survey object contains basic information such as:
 * - sid (Survey ID)
 * - surveyls_title (Survey title)
 * - active (Whether the survey is active or not)
 */
server.tool(
  "listSurveys", 
  "Lists all surveys that the authenticated user has permission to access",
  async () => {
    try {
      const surveys = await limesurveyAPI.listSurveys();
      return {
        content: [
          { 
            type: "text", 
            text: "List of surveys retrieved successfully" 
          },
          {
            type: "text", 
            text: JSON.stringify(surveys, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error listing surveys: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get detailed properties of a specific survey in LimeSurvey
 * 
 * Corresponds to the get_survey_properties method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_survey_properties
 * 
 * Returns an array with the survey properties for the requested survey
 * Properties include details about the survey settings, configuration, and metadata
 */
server.tool(
  "getSurveyProperties",
  "Gets detailed properties of a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey to get properties for")
  },
  async ({ surveyId }) => {
    try {
      const properties = await limesurveyAPI.getSurveyProperties(surveyId);
      return {
        content: [
          { 
            type: "text", 
            text: `Survey properties for survey ID ${surveyId} retrieved successfully` 
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
          text: `Error retrieving survey properties: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to activate a survey
 * 
 * Corresponds to the activate_survey method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_activate_survey
 * 
 * Activates a survey that is currently in inactive state
 */
server.tool(
  "activateSurvey",
  "Activates a survey that is currently inactive",
  {
    surveyId: z.string().describe("The ID of the survey to activate")
  },
  async ({ surveyId }) => {
    try {
      const result = await limesurveyAPI.activateSurvey(surveyId);
      return {
        content: [
          { 
            type: "text", 
            text: `Survey ID ${surveyId} activated successfully` 
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
          text: `Error activating survey: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get survey language properties
 * 
 * Corresponds to the get_language_properties method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_language_properties
 * 
 * Returns survey language specific properties
 */
server.tool(
  "getSurveyLanguageProperties",
  "Gets language specific properties for a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    language: z.string().describe("The language code")
  },
  async ({ surveyId, language }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const properties = await limesurveyAPI.request(
        'get_language_properties', 
        [key, surveyId, language]
      );
      return {
        content: [
          { 
            type: "text", 
            text: `Language properties for survey ID ${surveyId} (${language}) retrieved successfully` 
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
          text: `Error retrieving language properties: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get available site languages
 * 
 * Corresponds to the get_site_settings method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_site_settings
 * 
 * Returns available site languages
 */
server.tool(
  "getAvailableLanguages",
  "Gets available languages in the LimeSurvey installation",
  async () => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const settings = await limesurveyAPI.request(
        'get_site_settings', 
        [key, ['availablelanguages']]
      );
      
      let languages: string[] = [];
      if (settings?.availablelanguages) {
        try {
          // The setting is returned as a JSON string
          languages = JSON.parse(settings.availablelanguages);
        } catch (e) {
          console.error('Failed to parse available languages', e);
        }
      }
      
      return {
        content: [
          { 
            type: "text", 
            text: `Available languages in LimeSurvey: ${languages.join(', ')}` 
          },
          {
            type: "text", 
            text: JSON.stringify(settings, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving available languages: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

/**
 * Tool to get survey languages
 * 
 * Corresponds to the get_survey_languages method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_survey_languages
 * 
 * Returns available languages for a specific survey
 */
server.tool(
  "getSurveyLanguages",
  "Gets available languages for a specific survey",
  {
    surveyId: z.string().describe("The ID of the survey")
  },
  async ({ surveyId }) => {
    try {
      const key = await limesurveyAPI.getSessionKey();
      const languages = await limesurveyAPI.request(
        'get_survey_languages', 
        [key, surveyId]
      );
      return {
        content: [
          { 
            type: "text", 
            text: `Languages for survey ID ${surveyId}: ${languages.join(', ')}` 
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving survey languages: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);