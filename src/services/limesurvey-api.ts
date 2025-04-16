/**
 * LimeSurvey API Service
 * 
 * Provides methods to interact with the LimeSurvey Remote Control API
 * Documentation: https://api.limesurvey.org/classes/remotecontrol-handle.html
 */
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const LIMESURVEY_API_URL = process.env.LIMESURVEY_API_URL || 'http://localhost/limesurvey/index.php/admin/remotecontrol';
const LIMESURVEY_USERNAME = process.env.LIMESURVEY_USERNAME;
const LIMESURVEY_PASSWORD = process.env.LIMESURVEY_PASSWORD;

// LimeSurvey response interface
interface LimeSurveyResponse {
  id: number;
  result?: any;
  error?: string | {
    code: number;
    message: string;
  };
}

// Keep track of the session key
let sessionKey: string | null = null;

/**
 * The LimeSurvey API client
 */
class LimeSurveyAPI {
  private client: AxiosInstance;

  /**
   * Constructor
   */
  constructor() {
    this.client = axios.create({
      baseURL: LIMESURVEY_API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Make a request to the LimeSurvey API
   * @param {string} method - The LimeSurvey API method to call
   * @param {Array} params - The parameters to pass to the method
   * @returns {Promise<any>} - The response data
   */
  async request(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await this.client.post<LimeSurveyResponse>('', {
        method,
        params,
        id: 1
      });

      if (response.data.error) {
        throw new Error(`LimeSurvey API error: ${JSON.stringify(response.data.error)}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error(`LimeSurvey API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a session key from the LimeSurvey API
   * @returns {Promise<string>} - The session key
   */
  async getSessionKey(): Promise<string> {
    if (sessionKey) {
      return sessionKey;
    }

    if (!LIMESURVEY_USERNAME || !LIMESURVEY_PASSWORD) {
      throw new Error('LimeSurvey credentials not found in environment variables');
    }

    try {
      const key = await this.request('get_session_key', [LIMESURVEY_USERNAME, LIMESURVEY_PASSWORD]);
      if (typeof key === 'string' && key.trim() !== '') {
        sessionKey = key;
        return key;
      }
      throw new Error('Failed to get session key: Empty or invalid response from LimeSurvey API');
    } catch (error) {
      throw new Error(`Failed to get LimeSurvey session key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Release the session key
   * @returns {Promise<boolean>} - True if successful
   */
  async releaseSessionKey(): Promise<boolean> {
    if (!sessionKey) {
      return true;
    }

    try {
      await this.request('release_session_key', [sessionKey]);
      sessionKey = null;
      return true;
    } catch (error) {
      console.error(`Failed to release session key: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * List surveys
   * @returns {Promise<Array>} - List of surveys
   */
  async listSurveys(): Promise<any[]> {
    const key = await this.getSessionKey();
    return this.request('list_surveys', [key]);
  }
  
  /**
   * Get survey properties
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<Object>} - The survey properties
   */
  async getSurveyProperties(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_survey_properties', [key, surveyId]);
  }

  /**
   * List questions for a survey
   * @param {number|string} surveyId - The survey ID
   * @param {number|string} groupId - The group ID (optional)
   * @param {string} language - The language (optional)
   * @returns {Promise<Array>} - List of questions
   */
  async listQuestions(surveyId: number | string, groupId: number | string | null = null, language: string | null = null): Promise<any[]> {
    const key = await this.getSessionKey();
    return this.request('list_questions', [key, surveyId, groupId, language]);
  }

  /**
   * List question groups for a survey
   * @param {number|string} surveyId - The survey ID
   * @param {string} language - The language (optional)
   * @returns {Promise<Array>} - List of question groups
   */
  async listGroups(surveyId: number | string, language: string | null = null): Promise<any[]> {
    const key = await this.getSessionKey();
    return this.request('list_groups', [key, surveyId, language]);
  }

  /**
   * Get response count for a survey
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<Object>} - The response count stats
   */
  async getResponseCount(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_summary', [key, surveyId]);
  }

  /**
   * Export responses for a survey
   * @param {number|string} surveyId - The survey ID
   * @param {string} documentType - The document type (pdf, csv, xls, doc, json, etc.)
   * @param {string|null} language - Optional: The language code to use (default: survey's default language)
   * @param {string} completionStatus - Optional: 'complete','incomplete' or 'all' - defaults to 'all'
   * @param {string} headingType - Optional: 'code','full' or 'abbreviated' - defaults to 'code'
   * @param {string} responseType - Optional: 'short' or 'long' - defaults to 'short'
   * @param {number|null} fromResponseId - Optional: From response ID
   * @param {number|null} toResponseId - Optional: To response ID
   * @param {string[]|null} fields - Optional: Names of the fields to export
   * @param {Record<string, any>|null} additionalOptions - Optional: Additional options for export
   * @returns {Promise<string>} - Base64 encoded string containing the exported data
   */
  async exportResponses(
    surveyId: number | string, 
    documentType: string,
    language: string | null = null, 
    completionStatus: string = 'all', 
    headingType: string = 'code', 
    responseType: string = 'short',
    fromResponseId: number | null = null,
    toResponseId: number | null = null,
    fields: string[] | null = null,
    additionalOptions: Record<string, any> | null = null
  ): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_responses', [
      key, 
      surveyId, 
      documentType, 
      language, 
      completionStatus, 
      headingType, 
      responseType,
      fromResponseId,
      toResponseId,
      fields,
      additionalOptions
    ]);
  }

  /**
   * Export survey statistics
   * @param {number|string} surveyId - The survey ID
   * @param {string} documentType - The document type: 'pdf', 'xls', or 'html' (default: 'pdf')
   * @param {string|null} language - Optional: The language of the survey to use (default: survey default language)
   * @param {string} graph - Optional: Create graph option (default: '0' for no)
   * @param {number[]|number|null} groupIds - Optional: Array or integer containing the groups to generate statistics from
   * @returns {Promise<string>} - Base64 encoded string with the statistics file
   */
  async exportStatistics(
    surveyId: number | string,
    documentType: 'pdf' | 'xls' | 'html' = 'pdf',
    language: string | null = null,
    graph: '0' | '1' = '0',
    groupIds: number[] | number | null = null
  ): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_statistics', [
      key,
      surveyId,
      documentType,
      language,
      graph,
      groupIds
    ]);
  }

  /**
   * Activate a survey
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<Object>} - The activation result
   */
  async activateSurvey(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('activate_survey', [key, surveyId]);
  }

  /**
   * Add a participant to a survey
   * @param {number|string} surveyId - The survey ID
   * @param {Object} participantData - The participant data
   * @param {boolean} createToken - Whether to create a token (default: true)
   * @returns {Promise<Object>} - The result
   */
  async addParticipant(
    surveyId: number | string, 
    participantData: Record<string, any>, 
    createToken: boolean = true
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('add_participants', [key, surveyId, [participantData], createToken]);
  }
}

// Export a singleton instance
const limesurveyAPI = new LimeSurveyAPI();
export default limesurveyAPI;