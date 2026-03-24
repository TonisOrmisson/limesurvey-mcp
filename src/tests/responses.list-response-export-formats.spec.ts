import test from 'node:test';
import assert from 'node:assert/strict';
import { decode } from '@toon-format/toon';

async function loadModules() {
  process.env.LIMESURVEY_API_URL = process.env.LIMESURVEY_API_URL || 'http://example.invalid/remotecontrol';
  const apiModule = await import('../services/limesurvey-api.js');
  const responsesModule = await import('../tools/responses.js');
  return {
    api: apiModule.default as any,
    handler: responsesModule.listResponseExportFormatsHandler as () => Promise<any>
  };
}

test('listResponseExportFormats handler returns summary and raw payload', async () => {
  const { api, handler } = await loadModules();

  const exportsPayload = [
    {
      type: 'csv',
      pluginClass: 'Authdb',
      label: 'CSV',
      tooltip: null,
      onclick: null,
      isDefault: true
    },
    {
      type: 'customxml',
      pluginClass: 'CustomExportPlugin',
      label: 'Custom XML',
      tooltip: 'Plugin export',
      onclick: null,
      isDefault: false
    }
  ];

  const originalListResponseExports = api.listResponseExports;
  api.listResponseExports = async () => exportsPayload;

  try {
    const result = await handler();
    assert.equal(result.isError, undefined);
    assert.equal(result.content.length, 2);
    assert.match(result.content[0].text, /2 format\(s\)/);
    assert.match(result.content[0].text, /Default format\(s\): csv/);
    assert.doesNotMatch(result.content[0].text, /survey ID/);
    assert.deepEqual(decode(result.content[1].text), exportsPayload);
  } finally {
    api.listResponseExports = originalListResponseExports;
  }
});

test('listResponseExportFormats handler marks RC2 status errors', async () => {
  const { api, handler } = await loadModules();

  const statusPayload = { status: 'No permission' };

  const originalListResponseExports = api.listResponseExports;
  api.listResponseExports = async () => statusPayload;

  try {
    const result = await handler();
    assert.equal(result.isError, true);
    assert.equal(result.content.length, 2);
    assert.match(result.content[0].text, /No permission/);
    assert.deepEqual(decode(result.content[1].text), statusPayload);
  } finally {
    api.listResponseExports = originalListResponseExports;
  }
});

test('listResponseExportFormats handler marks thrown failures', async () => {
  const { api, handler } = await loadModules();

  const originalListResponseExports = api.listResponseExports;
  api.listResponseExports = async () => {
    throw new Error('Connection lost');
  };

  try {
    const result = await handler();
    assert.equal(result.isError, true);
    assert.equal(result.content.length, 1);
    assert.match(result.content[0].text, /Connection lost/);
  } finally {
    api.listResponseExports = originalListResponseExports;
  }
});
