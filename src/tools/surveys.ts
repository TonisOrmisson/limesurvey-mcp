import { z } from 'zod';
import { server } from '../server.js';
import limesurveyAPI from '../services/limesurvey-api.js';




/**
 * Tool to find surveys by ID or name (including partial matches)
 * 
 * This tool uses the list_surveys method in the LimeSurvey Remote API 
 * and then filters and sorts the results based on the search criteria
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_list_surveys
 * 
 * Returns an array of matching surveys sorted by creation date (newest first)
 */
server.tool(
    "findSurvey",
    "Finds surveys by ID or name (partial matches allowed), sorted by newest first",
    {
      searchTerm: z.string().describe("Survey ID or partial/full survey name to search for"),
      limit: z.number().optional().default(10).describe("Maximum number of results to return")
    },
    async ({ searchTerm, limit }) => {
      try {
        // Get all surveys
        const allSurveys = await limesurveyAPI.listSurveys();
        
        if (!Array.isArray(allSurveys) || allSurveys.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: "No surveys found in the system." 
            }]
          };
        }
        
        // Filter surveys by ID or title (case-insensitive)
        const searchTermLower = searchTerm.toLowerCase();
        let matchedSurveys = allSurveys.filter(survey => {
          // Match by ID (exact match)
          if (survey.sid && survey.sid.toString() === searchTerm) {
            return true;
          }
          
          // Match by title (contains, case-insensitive)
          if (survey.surveyls_title && 
              survey.surveyls_title.toLowerCase().includes(searchTermLower)) {
            return true;
          }
          
          return false;
        });
        
        // Sort by creation date (newest first)
        // LimeSurvey typically has 'created' or 'startdate' fields
        matchedSurveys.sort((a, b) => {
          // Try different date fields that might be present
          const dateA = a.created || a.startdate || a.datecreated || '0';
          const dateB = b.created || b.startdate || b.datecreated || '0';
          
          // Sort in reverse order (newest first)
          return dateB.localeCompare(dateA);
        });
        
        // Apply limit if specified
        if (limit && limit > 0) {
          matchedSurveys = matchedSurveys.slice(0, limit);
        }
        
        // Check if we found any matches
        if (matchedSurveys.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No surveys found matching '${searchTerm}'.` 
            }]
          };
        }
        
        return {
          content: [
            { 
              type: "text", 
              text: `Found ${matchedSurveys.length} survey(s) matching '${searchTerm}' (showing newest first):` 
            },
            {
              type: "text", 
              text: JSON.stringify(matchedSurveys, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error finding surveys: ${error?.message || 'Unknown error'}` 
          }],
          isError: true
        };
      }
    }
  );

  
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

/**
 * Tool to get quota information for a survey
 * 
 * Corresponds to the get_quota method in LimeSurvey Remote API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html#method_get_quota
 * 
 * Returns quota information including quotas, quota members, and quota language settings
 */
server.tool(
  "getQuotaInformation",
  "Gets quota information for a survey",
  {
    surveyId: z.string().describe("The ID of the survey"),
    quotaId: z.union([z.string(), z.number()]).optional().describe("Optional: Specific quota ID (if null, returns all quotas)"),
    language: z.string().optional().describe("Optional: Language for quota descriptions")
  },
  async ({ surveyId, quotaId, language }) => {
    try {
      const result = await limesurveyAPI.getQuotas(surveyId, quotaId || null, language || null);
      
      // Check if we got any quota information
      if (!result || (Array.isArray(result) && result.length === 0) || Object.keys(result).length === 0) {
        return {
          content: [
            { 
              type: "text", 
              text: quotaId 
                ? `No quota found with ID ${quotaId} for survey ${surveyId}` 
                : `No quotas found for survey ${surveyId}`
            }
          ]
        };
      }
      
      return {
        content: [
          { 
            type: "text", 
            text: quotaId 
              ? `Quota information for quota ID ${quotaId} retrieved successfully`
              : `All quota information for survey ID ${surveyId} retrieved successfully`
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
          text: `Error retrieving quota information: ${error?.message || 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

console.log("Surveys tools registered!");