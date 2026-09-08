const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ForeignKeyConstraintError } = require('sequelize');
const loadSource = require('./helpers/load-source.cjs');

function response() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('category pagination preserves data and reports the actual limit of 50', async () => {
  const controller = loadSource('src/controller/competent.controller.ts', {
    CompetencyCategories: { async findAndCountAll(options) {
      assert.deepEqual(options, { limit: 10, offset: 10, order: [['id', 'ASC']] });
      return { rows: [{ id: 11 }], count: 21 };
    } },
  });
  const res = response();
  await controller.getAllCategories({ query: { page: '2' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, data: [{ id: 11 }], pagination: { page: 2, limit: 10, total: 21, totalPages: 3 } });
  const bad = response();
  await controller.getAllCategories({ query: { limit: '51' } }, bad);
  assert.equal(bad.statusCode, 400);
  assert.match(bad.body.message, /50/);
});

test('malformed route IDs never reach update/delete queries', async () => {
  const controller = loadSource('src/controller/competent.controller.ts', {});
  for (const method of ['getCategoryById', 'getCompetentById', 'getBehaviorById', 'updateCategory', 'deleteCategory', 'updateCompetent', 'deleteCompetent', 'updateBehavior', 'deleteBehavior']) {
    for (const id of ['12abc', '1.5', '-1', '0', '9007199254740993']) {
      const res = response();
      await controller[method]({ params: { id }, body: {} }, res);
      assert.equal(res.statusCode, 400, `${method}: ${id}`);
    }
  }
});

test('missing competency records return 404 for reads, updates and deletes', async () => {
  const missing = { async findByPk() { return null; } };
  const controller = loadSource('src/controller/competent.controller.ts', {
    CompetencyCategories: missing, Competencies: missing, Behavior: missing,
  });
  for (const method of ['getCategoryById', 'getCompetentById', 'getBehaviorById', 'updateCategory', 'deleteCategory', 'updateCompetent', 'deleteCompetent', 'updateBehavior', 'deleteBehavior']) {
    const res = response();
    await controller[method]({ params: { id: '1' }, body: {} }, res);
    assert.equal(res.statusCode, 404, method);
  }
});

test('bulk competency creation rejects malformed bodies/items before writes', async () => {
  const service = loadSource('src/service/competent.service.ts', {});
  for (const method of ['createCategory', 'createCompetent', 'createBehavior']) {
    for (const body of [undefined, null, [], {}, { dataArray: [] }, { dataArray: [null] }, { dataArray: [[]] }]) {
      await assert.rejects(service[method](body), { status: 400 });
    }
  }
});

test('behavior creation drops caller-supplied primary keys and normalizes permitted fields', async () => {
  const service = loadSource('src/service/competent.service.ts', {
    Behavior: { async bulkCreate(rows) { return rows; } },
  });
  const rows = await service.createBehavior({ dataArray: [{ id: 77, competency_id: '2', description: 'Example', status: 'Y', extra: true }] });
  assert.deepEqual(rows, [{ competency_id: 2, description: 'Example', status: 'Y' }]);
  for (const competency_id of [true, [1], {}, '1abc', -1]) {
    await assert.rejects(service.createBehavior({ dataArray: [{ competency_id }] }), { status: 400 });
  }
});

test('competency update validates fields and preserves nullable optional IDs and scores', async () => {
  const service = loadSource('src/service/competent.service.ts', {
    Competencies: { async findByPk() { return { async update(payload) { return payload; } }; } },
  });
  for (const body of [undefined, {}, { id: 8 }, { competency: ' ' }, { competency_category_id: true }, { expected_score: 128 }]) {
    await assert.rejects(service.updateCompetent(1, body), { status: 400 });
  }
  assert.deepEqual(await service.updateCompetent(1, { type_person_id: '', expected_score: '0', status: '' }), {
    type_person_id: null, expected_score: 0, status: null,
  });
});

test('foreign key conflicts use 409 and unexpected failures use a safe 500 response', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const [error, expected] of [[new ForeignKeyConstraintError({}), 409], [new Error('private SQL connection details'), 500]]) {
    for (const [file, model, method] of [
      ['competent', 'CompetencyCategories', 'deleteCategory'],
      ['assessmentcompetent', 'ValueOrders', 'getOrderById'],
      ['kpi', 'KpiIndicators', 'getIndicatorById'],
    ]) {
      const controller = loadSource(`src/controller/${file}.controller.ts`, {
        [model]: { async findByPk() { throw error; } },
      });
      const res = response();
      await controller[method]({ params: { id: '1' } }, res);
      assert.equal(res.statusCode, expected);
      assert.doesNotMatch(res.body.message, /private SQL/);
    }
  }
});

test('assessment score input rejects boolean/array competency IDs', async () => {
  const service = loadSource('src/service/assessmentcompetent.service.ts', {
    sequelize: { async transaction(action) { return action({ LOCK: { UPDATE: 'UPDATE' } }); } },
    ValueOrders: { async findByPk() { return { id: 1 }; } },
  });
  for (const quest of [true, [1], '9007199254740993']) {
    await assert.rejects(service.saveScores(1, [{ quest, user_value: 1 }]), { status: 400 });
  }
});

test('assessment controller reports invalid bodies and preserves missing-record status', async () => {
  const controller = loadSource('src/controller/assessmentcompetent.controller.ts', {
    ValueOrders: { async findByPk() { return null; } },
  });
  const bad = response();
  await controller.createOrder({ body: undefined }, bad);
  assert.equal(bad.statusCode, 400);
  const missing = response();
  await controller.getOrderById({ params: { id: '1' } }, missing);
  assert.equal(missing.statusCode, 404);
});

test('KPI creation rejects malformed bodies and coerced IDs before DB writes', async () => {
  const service = loadSource('src/service/kpi.service.ts', {
    KpiIndicators: { create() { assert.fail('Unexpected DB write'); }, bulkCreate() { assert.fail('Unexpected DB write'); } },
  });
  for (const name of ['createIndicator', 'createScoreLevels', 'createAssessmentValues']) {
    for (const body of [undefined, null, {}, { dataArray: [null] }]) {
      await assert.rejects(service[name](body), { status: 400 });
    }
  }
  for (const kpi_indicator_id of [true, [1], '9007199254740993']) {
    await assert.rejects(service.createScoreLevels({ dataArray: [{ kpi_indicator_id, score: 1 }] }), { status: 400 });
  }
});

test('valid KPI indicator creation keeps the 201 response and trims the name', async () => {
  const controller = loadSource('src/controller/kpi.controller.ts', {
    KpiIndicators: { async create(payload) { return { id: 1, ...payload }; } },
  });
  const res = response();
  await controller.createIndicator({ body: { name: ' Quality ', weight: '20.5' } }, res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { success: true, data: { id: 1, name: 'Quality', weight: 20.5 } });
});

test('assessment orders retain nullable fields and default draft creation', async () => {
  const service = loadSource('src/service/assessmentcompetent.service.ts', {
    ValueOrders: { async create(payload) { return payload; } },
  });
  assert.deepEqual(await service.createOrder({}), {});
  assert.deepEqual(await service.createOrder({ user_id: '1', head_id: '', round: '2', year: '2569' }), {
    user_id: 1, head_id: null, round: 2, year: 2569,
  });
  for (const body of [{ user_id: true }, { round: 128 }, { year: 32768 }, { status: [] }]) {
    await assert.rejects(service.createOrder(body), { status: 400 });
  }
  await assert.rejects(service.updateOrder(1, { unexpected: true }), { status: 400 });
});

test('confirmed competency scores remain immutable, including a final score of zero', async () => {
  const service = loadSource('src/service/assessmentcompetent.service.ts', {
    sequelize: { async transaction(action) { return action({ LOCK: { UPDATE: 'UPDATE' } }); } },
    ValueData: { async findByPk() { return { submit_value: 0, user_value: 1, head_value: 1 }; } },
  });
  await assert.rejects(service.updateScoreItem(1, { user_value: 2 }), { status: 409 });
  await assert.rejects(service.submitScoreItem(1, 2), { status: 409 });
});
