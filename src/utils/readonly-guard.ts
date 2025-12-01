import { isReadOnlyMode } from '../server.js';
import { logger } from './logger.js';

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

/**
 * Guard for write operations when READONLY_MODE is enabled.
 *
 * If the server is running with READONLY_MODE=true, this helper returns
 * a standardized error payload and logs a warning. Callers should return
 * the result immediately when it is non-null to short‑circuit execution.
 */
export function ensureWriteAllowed(operationName: string): ToolResult | null {
  if (!isReadOnlyMode) {
    return null;
  }

  const message =
    `Write operation "${operationName}" is disabled because READONLY_MODE=true. ` +
    `Set READONLY_MODE=false to enable write tools.`;

  logger.warn('Blocked write operation in READONLY_MODE', {
    operation: operationName,
  });

  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

