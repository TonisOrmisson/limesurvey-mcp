import test from 'node:test';
import assert from 'node:assert/strict';

async function loadManagementModules() {
  process.env.LIMESURVEY_API_URL =
    process.env.LIMESURVEY_API_URL || 'http://example.invalid/remotecontrol';

  const [{ default: api }, { server }] = await Promise.all([
    import('../services/limesurvey-api.js'),
    import('../server.js')
  ]);

  await import('../tools/group-management.js');
  await import('../tools/question-management.js');

  const tools = ((server as any)._registeredTools || (server as any)._registry?.tools || {}) as Record<
    string,
    {
      inputSchema: { parse: (input: unknown) => any };
      callback: (input: any) => Promise<any>;
    }
  >;

  return { api: api as any, tools };
}

test('group/question management tools mark RC2 status payloads as errors', async () => {
  const { api, tools } = await loadManagementModules();

  const statusPayload = { status: 'No permission' };
  const originals = {
    addGroup: api.addGroup,
    deleteGroup: api.deleteGroup,
    importQuestion: api.importQuestion,
    deleteQuestion: api.deleteQuestion
  };

  api.addGroup = async () => statusPayload;
  api.deleteGroup = async () => statusPayload;
  api.importQuestion = async () => statusPayload;
  api.deleteQuestion = async () => statusPayload;

  try {
    const addGroupResult = await tools.addGroup.callback({
      surveyId: 1,
      title: 'Group A',
      description: ''
    });
    assert.equal(addGroupResult.isError, true);
    assert.match(addGroupResult.content[0].text, /No permission/);
    assert.deepEqual(JSON.parse(addGroupResult.content[1].text), statusPayload);

    const deleteGroupResult = await tools.deleteGroup.callback({
      surveyId: 1,
      groupId: 2,
      confirmDeletion: true
    });
    assert.equal(deleteGroupResult.isError, true);
    assert.match(deleteGroupResult.content[0].text, /No permission/);
    assert.deepEqual(JSON.parse(deleteGroupResult.content[1].text), statusPayload);

    const importQuestionResult = await tools.importQuestion.callback({
      surveyId: 1,
      groupId: 2,
      importData: 'Zg==',
      importDataType: 'lsq',
      mandatory: 'N'
    });
    assert.equal(importQuestionResult.isError, true);
    assert.match(importQuestionResult.content[0].text, /No permission/);
    assert.deepEqual(JSON.parse(importQuestionResult.content[1].text), statusPayload);

    const deleteQuestionResult = await tools.deleteQuestion.callback({
      questionId: 3,
      confirmDeletion: true
    });
    assert.equal(deleteQuestionResult.isError, true);
    assert.match(deleteQuestionResult.content[0].text, /No permission/);
    assert.deepEqual(JSON.parse(deleteQuestionResult.content[1].text), statusPayload);
  } finally {
    api.addGroup = originals.addGroup;
    api.deleteGroup = originals.deleteGroup;
    api.importQuestion = originals.importQuestion;
    api.deleteQuestion = originals.deleteQuestion;
  }
});

test("importQuestion schema accepts LimeSurvey soft-mandatory mode 'S'", async () => {
  const { tools } = await loadManagementModules();

  const parsed = tools.importQuestion.inputSchema.parse({
    surveyId: 1,
    groupId: 2,
    importData: 'Zg==',
    importDataType: 'lsq',
    mandatory: 'S'
  });

  assert.equal(parsed.mandatory, 'S');
});
