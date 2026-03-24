import test from 'node:test';
import assert from 'node:assert/strict';
import { decode } from '@toon-format/toon';

async function loadModules() {
  process.env.LIMESURVEY_API_URL = process.env.LIMESURVEY_API_URL || 'http://example.invalid/remotecontrol';
  const apiModule = await import('../services/limesurvey-api.js');
  const responsesModule = await import('../tools/responses.js');
  return {
    api: apiModule.default as any,
    exportResponsesHandler: responsesModule.exportResponsesHandler as (args: {
      surveyId: string;
      documentType: string;
      language?: string;
      completionStatus: 'complete' | 'incomplete' | 'all';
      headingType: 'code' | 'full' | 'abbreviated';
      responseType: 'short' | 'long';
      fromResponseId?: number;
      toResponseId?: number;
      fields?: string[];
      additionalOptions?: Record<string, any>;
      decodeOutput: boolean;
    }) => Promise<any>,
    exportResponsesByTokenHandler: responsesModule.exportResponsesByTokenHandler as (args: {
      surveyId: string;
      token: string;
      documentType: string;
      language?: string;
      completionStatus: 'complete' | 'incomplete' | 'all';
      headingType: 'code' | 'full' | 'abbreviated';
      responseType: 'short' | 'long';
      decodeOutput: boolean;
    }) => Promise<any>
  };
}

test('exportResponses handler returns raw base64 payload for plugin/binary formats', async () => {
  const { api, exportResponsesHandler } = await loadModules();
  const exportData = 'U1BTUy1QQVlMT0FE';

  const originalExportResponses = api.exportResponses;
  api.exportResponses = async () => exportData;

  try {
    const result = await exportResponsesHandler({
      surveyId: '12345',
      documentType: 'spsssav_custom',
      completionStatus: 'all',
      headingType: 'code',
      responseType: 'short',
      decodeOutput: true
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.content.length, 2);
    assert.match(result.content[0].text, /spsssav_custom/);
    assert.equal(result.content[1].text, `Base64 payload:\n${exportData}`);
  } finally {
    api.exportResponses = originalExportResponses;
  }
});

test('exportResponses handler keeps preview and includes raw base64 payload for text formats', async () => {
  const { api, exportResponsesHandler } = await loadModules();
  const decoded = JSON.stringify({ ok: true, rows: [1, 2, 3] });
  const exportData = Buffer.from(decoded, 'utf-8').toString('base64');

  const originalExportResponses = api.exportResponses;
  api.exportResponses = async () => exportData;

  try {
    const result = await exportResponsesHandler({
      surveyId: '12345',
      documentType: 'json',
      completionStatus: 'all',
      headingType: 'code',
      responseType: 'short',
      decodeOutput: true
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.content.length, 3);
    assert.match(result.content[1].text, /Preview of exported data:/);
    assert.match(result.content[1].text, /ok: true/);
    assert.equal(result.content[2].text, `Raw base64 payload:\n${exportData}`);
  } finally {
    api.exportResponses = originalExportResponses;
  }
});

test('exportResponsesByToken handler returns base64 payload', async () => {
  const { api, exportResponsesByTokenHandler } = await loadModules();
  const exportData = 'VE9LRU4tUEFZTE9BRA==';

  const originalExportResponsesByToken = api.exportResponsesByToken;
  api.exportResponsesByToken = async () => exportData;

  try {
    const result = await exportResponsesByTokenHandler({
      surveyId: '12345',
      token: 'tok-1',
      documentType: 'pdf',
      completionStatus: 'all',
      headingType: 'code',
      responseType: 'short',
      decodeOutput: true
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.content.length, 2);
    assert.match(result.content[0].text, /tok-1/);
    assert.equal(result.content[1].text, `Base64 payload:\n${exportData}`);
  } finally {
    api.exportResponsesByToken = originalExportResponsesByToken;
  }
});
