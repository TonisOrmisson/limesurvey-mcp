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

  /**
   * Import a survey archive
   * @param {string} surveyFile - Base64 encoded string containing the survey structure
   * @param {string} importName - The name to use for the survey after import
   * @param {number} ownerId - Optional: The owner ID for the survey
   * @returns {Promise<number>} - Survey ID of the imported survey
   */
  async importSurvey(
    surveyFile: string,
    importName: string,
    ownerId: number | null = null
  ): Promise<number> {
    const key = await this.getSessionKey();
    return this.request('import_survey', [key, surveyFile, importName, ownerId]);
  }

  /**
   * Export survey structure as LSS file
   *
   * NOTE: There is no officially documented `export_survey` method in the
   * current RemoteControl2 docs. This wrapper assumes your LimeSurvey
   * instance provides an `export_survey` RPC function compatible with
   * the legacy API. If it does *not* exist, calls to this method will
   * fail with "method export_survey not found".
   *
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<string>} - Base64 encoded string containing the survey structure
   */
  async exportSurveyStructure(surveyId: number | string): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_survey', [key, surveyId]);
  }

  /**
   * Copy a survey
   * @param {number|string} surveyId - The survey ID to copy
   * @param {string} newname - Optional: The name of the new survey
   * @returns {Promise<number>} - The new survey ID
   */
  async copySurvey(surveyId: number | string, newname: string | null = null): Promise<number> {
    const key = await this.getSessionKey();
    return this.request('copy_survey', [key, surveyId, newname]);
  }

  /**
   * Add a new (empty) survey
   * @param {string} title - Survey title
   * @param {string} language - Base language (default: en)
   * @param {string} format - Question display format: 'A' (all), 'G' (group), 'S' (single) – default 'G'
   * @returns {Promise<number>} - Newly created survey ID
   */
  async addSurvey(
    title: string,
    language: string = 'en',
    format: 'A' | 'G' | 'S' = 'G'
  ): Promise<number> {
    const key = await this.getSessionKey();
    return this.request('add_survey', [key, null, title, language, format]);
  }

  /**
   * Delete a survey
   * @param {number|string} surveyId - The survey ID to delete
   * @returns {Promise<Object>} - Status of the operation
   */
  async deleteSurvey(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('delete_survey', [key, surveyId]);
  }

  /**
   * Activate token table for a survey
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<string|object>} - Status of activation
   */
  async activateTokens(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('activate_tokens', [key, surveyId]);
  }

  /**
   * Import a survey group
   * @param {string} importData - Base64 encoded string containing the survey group structure
   * @param {string} importName - The name to use for the survey group after import
   * @param {string} importVersion - Optional: The version to use (default null = detect)
   * @returns {Promise<any>} - Import status
   */
  async importGroup(importData: string, importName: string, importVersion: string | null = null): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('import_group', [key, importData, importName, importVersion]);
  }

  /**
   * Export a question group
   * @param {number|string} surveyId - The survey ID
   * @param {number|string} groupId - The group ID
   * @returns {Promise<string>} - Base64 encoded string containing the group structure
   */
  async exportGroup(surveyId: number | string, groupId: number | string): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_group', [key, surveyId, groupId]);
  }

  /**
   * Delete a response from a survey
   * @param {number|string} surveyId - The survey ID
   * @param {number|string} responseId - The response ID to delete
   * @returns {Promise<Object>} - Status of the operation
   */
  async deleteResponse(surveyId: number | string, responseId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('delete_response', [key, surveyId, responseId]);
  }

  /**
   * Add response to a survey
   * @param {number|string} surveyId - The survey ID
   * @param {Record<string, any>} responseData - The response data as an object
   * @returns {Promise<number>} - The response ID
   */
  async addResponse(surveyId: number | string, responseData: Record<string, any>): Promise<number> {
    const key = await this.getSessionKey();
    return this.request('add_response', [key, surveyId, responseData]);
  }

  /**
   * Update response in a survey
   * @param {number|string} surveyId - The survey ID
   * @param {number|string} responseId - The response ID
   * @param {Record<string, any>} responseData - The response data to update
   * @returns {Promise<string>} - Status of the operation
   */
  async updateResponse(
    surveyId: number | string, 
    responseId: number | string, 
    responseData: Record<string, any>
  ): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('update_response', [key, surveyId, responseId, responseData]);
  }

  /**
   * Get list of response IDs (optionally filtered by token)
   */
  async getResponseIds(surveyId: number | string, token: string | null = null): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_response_ids', [key, surveyId, token]);
  }

  /**
   * Export responses filtered by token
   */
  async exportResponsesByToken(
    surveyId: number | string,
    token: string,
    documentType: string,
    language: string | null = null,
    completionStatus: string = 'all',
    headingType: string = 'code',
    responseType: string = 'short'
  ): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_responses_by_token', [
      key,
      surveyId,
      token,
      documentType,
      language,
      completionStatus,
      headingType,
      responseType
    ]);
  }

  /**
   * Export response timeline
   */
  async exportTimeline(
    surveyId: number | string,
    documentType: string = 'json',
    language: string | null = null,
    dateFrom: string | null = null,
    dateTo: string | null = null
  ): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('export_timeline', [key, surveyId, documentType, language, dateFrom, dateTo]);
  }

  /**
   * Get field map (question code to SGQA mapping)
   */
  async getFieldMap(
    surveyId: number | string,
    language: string | null = null,
    forceRefresh: boolean = false
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_fieldmap', [key, surveyId, language, forceRefresh]);
  }

  /**
   * Upload a file for a survey
   * @param {number|string} surveyId - The survey ID
   * @param {string} fileData - Base64 encoded file content
   * @param {string} fileName - The name of the file
   * @returns {Promise<string>} - The relative URL to the file in the survey
   */
  async uploadFile(surveyId: number | string, fileData: string, fileName: string): Promise<string> {
    const key = await this.getSessionKey();
    return this.request('upload_file', [key, surveyId, fileData, fileName]);
  }

  /**
   * Get uploaded files for a survey
   * @param {number|string} surveyId - The survey ID
   * @returns {Promise<Object>} - List of files
   */
  async getUploadedFiles(surveyId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_uploaded_files', [key, surveyId]);
  }

  /**
   * List survey participants with extended options
   * @param {number|string} surveyId - The survey ID
   * @param {number} iStart - Optional: Start from the nth participant (default: 0)
   * @param {number} iLimit - Optional: Number of participants to return (default: all)
   * @param {boolean} bUnused - Optional: Whether to filter for unused tokens (default: false)
   * @param {boolean|Array} aAttributes - Optional: Array of attributes to include (default: all)
   * @param {Object} aConditions - Optional: Conditions to filter participants
   * @returns {Promise<Array>} - List of participants
   */
  async listParticipants(
    surveyId: number | string,
    iStart: number = 0,
    iLimit: number = 10,
    bUnused: boolean = false,
    aAttributes: boolean | Array<string> = false,
    aConditions: Record<string, any> = {}
  ): Promise<any[]> {
    const key = await this.getSessionKey();
    return this.request('list_participants', [key, surveyId, iStart, iLimit, bUnused, aAttributes, aConditions]);
  }

  /**
   * Add multiple participants to a survey
   * @param {number|string} surveyId - The survey ID
   * @param {Array<Record<string, any>>} participants - Array of participant data
   * @param {boolean} createToken - Optional: Whether to create tokens (default: true)
   * @returns {Promise<Array>} - Array with the added participants
   */
  async addParticipants(
    surveyId: number | string,
    participants: Array<Record<string, any>>,
    createToken: boolean = true
  ): Promise<any[]> {
    const key = await this.getSessionKey();
    return this.request('add_participants', [key, surveyId, participants, createToken]);
  }

  /**
   * Delete one or more participants from a survey
   * @param {number|string} surveyId - The survey ID
   * @param {Array<string>} tokens - Array of token IDs to delete
   * @returns {Promise<Object>} - Status of the operation
   */
  async deleteParticipants(
    surveyId: number | string,
    tokens: Array<string>
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('delete_participants', [key, surveyId, tokens]);
  }

  /**
   * Get a questionnaire definition in JSON format
   * @param {number|string} surveyId - The survey ID
   * @param {string|null} language - Optional: Language code (if null, uses the base language)
   * @param {boolean} includeTokens - Optional: Whether to include tokens (default: false)
   * @returns {Promise<Object>} - Questionnaire definition
   */
  async getQuestionnaireDefinition(
    surveyId: number | string,
    language: string | null = null,
    includeTokens: boolean = false
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_questionnaire_definition', [key, surveyId, language, includeTokens]);
  }

  /**
   * Get properties of a single quota.
   *
   * Wraps the `get_quota_properties` RemoteControl method:
   *   get_quota_properties($sessionKey, $iQuotaId, $aQuotaSettings = null, $sLanguage = null)
   *
   * This client does NOT support listing all quotas for a survey via RC2.
   *
   * @param {number|string} quotaId - Specific quota ID (required)
   * @param {string|null} language - Optional: language for quota descriptions
   * @returns {Promise<Object>} - Quota information for the given quota ID
   */
  async getQuotaProperties(
    quotaId: number | string,
    language: string | null = null
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_quota_properties', [key, quotaId, null, language]);
  }

  /**
   * Add a new quota to a survey.
   * Thin wrapper around the add_quota API; for advanced options
   * (e.g. custom messages/URLs), call setQuotaProperties afterwards.
   *
   * @param {number|string} surveyId - The survey ID
   * @param {string} name - Quota name
   * @param {number} limit - Maximum number of responses for this quota
   * @returns {Promise<any>} - Quota creation result (usually quota ID and data)
   */
  async addQuota(
    surveyId: number | string,
    name: string,
    limit: number
  ): Promise<any> {
    const key = await this.getSessionKey();
    // The RemoteControl API defines additional optional parameters
    // (active flag, action, messages, URLs, etc.) with sensible defaults.
    // We rely on those defaults here for a simple, focused wrapper.
    return this.request('add_quota', [key, surveyId, name, limit]);
  }

  /**
   * Update properties of an existing quota.
   *
   * @param {number|string} quotaId - The quota ID
   * @param {Record<string, any>} data - Quota fields to update
   * @returns {Promise<any>} - Result of the update operation
   */
  async setQuotaProperties(
    quotaId: number | string,
    data: Record<string, any>
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('set_quota_properties', [key, quotaId, data]);
  }

  /**
   * Delete a quota.
   *
   * @param {number|string} quotaId - The quota ID to delete
   * @returns {Promise<any>} - Deletion status
   */
  async deleteQuota(quotaId: number | string): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('delete_quota', [key, quotaId]);
  }

  /**
   * Add a new language to a survey.
   *
   * @param {number|string} surveyId - The survey ID
   * @param {string} language - Language code to add (e.g. "de", "fr")
   * @returns {Promise<any>} - Language addition result
   */
  async addLanguage(
    surveyId: number | string,
    language: string
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('add_language', [key, surveyId, language]);
  }

  /**
   * Delete a language from a survey.
   *
   * @param {number|string} surveyId - The survey ID
   * @param {string} language - Language code to remove
   * @returns {Promise<any>} - Deletion status
   */
  async deleteLanguage(
    surveyId: number | string,
    language: string
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('delete_language', [key, surveyId, language]);
  }

  /**
   * Update survey language properties (locale data) for a given language.
   *
   * @param {number|string} surveyId - The survey ID
   * @param {Record<string, any>} localeData - Locale data fields to update
   * @param {string|null} language - Optional language code (null = base language)
   * @returns {Promise<any>} - Update result
   */
  async setLanguageProperties(
    surveyId: number | string,
    localeData: Record<string, any>,
    language: string | null = null
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('set_language_properties', [key, surveyId, localeData, language]);
  }

  /**
   * Get user details for one or multiple users
   * @param {number|string|number[]|string[]|null} userId - User ID(s) or null for current user
   * @param {string[]} attributes - Optional: User attributes to fetch
   * @returns {Promise<Object>} - User details
   */
  async getUserDetails(
    userId: number | string | number[] | string[] | null = null,
    attributes: string[] = []
  ): Promise<any> {
    const key = await this.getSessionKey();
    return this.request('get_user_details', [key, userId, attributes]);
  }
}

// Export a singleton instance
const limesurveyAPI = new LimeSurveyAPI();
export default limesurveyAPI;
