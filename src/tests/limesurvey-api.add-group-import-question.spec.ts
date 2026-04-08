import test from 'node:test';
import assert from 'node:assert/strict';

async function loadApi() {
  process.env.LIMESURVEY_API_URL =
    process.env.LIMESURVEY_API_URL || 'http://example.invalid/remotecontrol';
  return import('../services/limesurvey-api.js');
}

test('addGroup forwards RC2 parameter order', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedMethod = '';
  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'session-key-123';
  mutableApi.request = async (method: string, params: any[]) => {
    capturedMethod = method;
    capturedParams = params;
    return 42;
  };

  try {
    const result = await api.addGroup(7, 'Section A', 'Optional desc');
    assert.equal(capturedMethod, 'add_group');
    assert.deepEqual(capturedParams, ['session-key-123', 7, 'Section A', 'Optional desc']);
    assert.equal(result, 42);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});

test('importQuestion forwards RC2 parameter order including optionals', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedMethod = '';
  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'session-key-xyz';
  mutableApi.request = async (method: string, params: any[]) => {
    capturedMethod = method;
    capturedParams = params;
    return 99;
  };

  const b64 = Buffer.from('<lsq/>').toString('base64');

  try {
    const result = await api.importQuestion(
      1,
      2,
      b64,
      'lsq',
      'Y',
      'Q1',
      'Text?',
      'Help'
    );
    assert.equal(capturedMethod, 'import_question');
    assert.deepEqual(capturedParams, [
      'session-key-xyz',
      1,
      2,
      b64,
      'lsq',
      'Y',
      'Q1',
      'Text?',
      'Help'
    ]);
    assert.equal(result, 99);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});

test('importQuestion uses N/null defaults for optional rename fields', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'sk';
  mutableApi.request = async (_method: string, params: any[]) => {
    capturedParams = params;
    return 1;
  };

  try {
    await api.importQuestion(10, 20, 'Zmxv', 'lsq');
    assert.deepEqual(capturedParams, ['sk', 10, 20, 'Zmxv', 'lsq', 'N', null, null, null]);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});

test('deleteGroup forwards RC2 parameter order', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedMethod = '';
  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'sess';
  mutableApi.request = async (method: string, params: any[]) => {
    capturedMethod = method;
    capturedParams = params;
    return 5;
  };

  try {
    const result = await api.deleteGroup(100, 5);
    assert.equal(capturedMethod, 'delete_group');
    assert.deepEqual(capturedParams, ['sess', 100, 5]);
    assert.equal(result, 5);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});

test('deleteQuestion forwards RC2 parameter order', async () => {
  const { default: api } = await loadApi();
  const mutableApi = api as any;

  const originalGetSessionKey = mutableApi.getSessionKey;
  const originalRequest = mutableApi.request;

  let capturedMethod = '';
  let capturedParams: any[] = [];

  mutableApi.getSessionKey = async () => 'sess2';
  mutableApi.request = async (method: string, params: any[]) => {
    capturedMethod = method;
    capturedParams = params;
    return 88;
  };

  try {
    const result = await api.deleteQuestion(88);
    assert.equal(capturedMethod, 'delete_question');
    assert.deepEqual(capturedParams, ['sess2', 88]);
    assert.equal(result, 88);
  } finally {
    mutableApi.getSessionKey = originalGetSessionKey;
    mutableApi.request = originalRequest;
  }
});
