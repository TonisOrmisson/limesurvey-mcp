import test from 'node:test';
import assert from 'node:assert/strict';

async function loadApi() {
  process.env.LIMESURVEY_API_URL = process.env.LIMESURVEY_API_URL || 'http://example.invalid/remotecontrol';
  return import('../services/limesurvey-api.js');
}

test('listResponseExports forwards the request parameters to RC2', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const expectedPayload = [
    {
      type: 'csv',
      pluginClass: 'Authdb',
      label: 'CSV',
      tooltip: null,
      onclick: null,
      isDefault: true
    }
  ];

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedMethod = '';
  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'session-key-123';
  mutableApi.request = async (method: string, params: any[]) => {
    capturedMethod = method;
    capturedParams = params;
    return expectedPayload;
  };

  try {
    const result = await api.listResponseExports('12345');

    assert.equal(capturedMethod, 'list_response_exports');
    assert.deepEqual(capturedParams, ['session-key-123', '12345']);
    assert.deepEqual(result, expectedPayload);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});

test('listResponseExports preserves RC2 status payloads', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const statusPayloads = [
    { status: 'No permission' },
    { status: 'Invalid session key' },
    []
  ];

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let index = 0;
  mutableApi.getSessionKey = async () => 'session-key-123';
  mutableApi.request = async () => statusPayloads[index++];

  try {
    for (const payload of statusPayloads) {
      const result = await api.listResponseExports('12345');
      assert.deepEqual(result, payload);
    }
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});
