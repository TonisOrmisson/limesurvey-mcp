import { encode } from '@toon-format/toon';
import { logger } from './logger.js';

/**
 * Formats data for LLM consumption using TOON (Token-Oriented Object Notation).
 * TOON is more token-efficient (~40% reduction) and structure-aware for LLMs.
 * 
 * @param data The data to encode
 * @returns TOON encoded string
 */
export function formatForLLM(data: any): string {
  try {
    // If it's already a string, return it as is or handle it
    if (typeof data === 'string') {
      return data;
    }
    
    // If it's null or undefined, return a descriptive string
    if (data === null || data === undefined) {
      return String(data);
    }

    // Use TOON encoding
    return encode(data);
  } catch (error) {
    logger.error('TOON encoding failed, falling back to JSON', { error, data });
    try {
      return JSON.stringify(data, null, 2);
    } catch (jsonError) {
      logger.error('JSON fallback also failed', { jsonError });
      return String(data);
    }
  }
}
