const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');

// Replace the database before importing routes; these tests never connect to MySQL.
const dbPath = require.resolve('../src/models/product');
const db = {
  ValueOrders: { findByPk: async () => null },
  KpiIndicators: { findAll: async () => [] },
  KpiScoreLevels: { findAll: async () => [] },
  KpiAssessmentValues: { findByPk: async () => null },
  ValueData: { findByPk: async () => ({ submit_value: 0 }) },
  sequelize: { transaction: async (action) => action({ LOCK: { UPDATE: 'UPDATE' } }) },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: db } };
const express = require('express');
const router = require('../src/routes/user.route').default;
const { userRequestError } = require('../src/middleware/user-request.middleware');

test('user routes preserve success data and return appropriate JSON errors', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/user', router);
  app.use('/api/user', userRequestError);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/user`;
  async function check(path, options, status, body) {
    const response = await fetch(base + path, options);
    assert.equal(response.status, status);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await response.json(), body);
  }
  await check('/kpi-levels', {}, 200, { success: true, data: [] });
  await check('/assessments/nope/summary', {}, 400, { success: false, message: 'orderId must be a positive integer' });
  await check('/assessments/1/summary', {}, 404, { success: false, message: 'Assessment order not found' });
  await check('/kpi-assessments/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"user_value":4}' }, 404, { success: false, message: 'KPI assessment value not found' });
  await check('/competency-scores', { method: 'POST' }, 400, { success: false, message: 'Request body must be a JSON object' });
  await check('/competency-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[' }, 400, { success: false, message: 'Invalid JSON request body' });
  await check('/competency-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]' }, 400, { success: false, message: 'Request body must be a JSON object' });
  await check('/competency-scores/1/submit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"submit_value":0}' }, 409, { success: false, message: 'This competency assessment has already been submitted and cannot be changed' });
  db.KpiScoreLevels.findAll = async () => { throw new Error('private SQL connection details'); };
  const log = t.mock.method(console, 'error', () => {});
  await check('/kpi-levels', {}, 500, { success: false, message: 'Internal server error' });
  assert.equal(log.mock.callCount(), 1);

  await check('/assessments/1/sheet', {}, 404, { success: false, message: 'Assessment order not found' });
  const order = { id: 7, user_id: 10, head_id: 20, round: 1, year: 2569, status: 'Y' };
  db.ValueOrders.findByPk = async (id) => {
    assert.equal(id, order.id);
    return order;
  };
  const score = { id: 3, value_order_id: 7, quest: 1, user_value: 0 };
  db.CompetencyCategories = { findAll: async (options) => {
    assert.equal(options.include[0].include[1].where.value_order_id, order.id);
    return [{ get: () => ({ id: 1, name: 'Core Competency', competencies: [
      { id: 1, behaviors: [], value_data_quests: [score] },
      { id: 2, behaviors: [], value_data_quests: [] },
    ] }) }];
  } };
  await check('/assessments/7/sheet', {}, 200, { success: true, data: {
    value_order: order,
    categories: [{ id: 1, name: 'Core Competency', competencies: [
      { id: 1, behaviors: [], score },
      { id: 2, behaviors: [], score: null },
    ] }],
  } });
  db.CompetencyCategories.findAll = async () => [];
  await check('/assessments/7/sheet', {}, 200, { success: true, data: { value_order: order, categories: [] } });

  const draft = { id: 1, value_order_id: 7, kpi_indicator_id: 2, status: 'DRAFT', submit_value: null, weight: '30.00', weighted_score: '1.3500', kpi_indicator: { id: 2, weight: '45.00' } };
  const submitted = { ...draft, id: 2, status: 'SUBMITTED', submit_value: 0, weighted_score: '0.0000' };
  db.KpiAssessmentValues.findAll = async (options) => {
    assert.equal(options.where.value_order_id, '7');
    assert.equal(options.where.status, 'DRAFT');
    assert.equal(options.include.some((item) => item.as === 'value_order'), false);
    return [{ get: () => ({ ...draft }) }];
  };
  await check('/kpi-assessments/7?value_order_id=99&status=DRAFT', {}, 200, {
    success: true, data: { value_order: order, kpi_assessments: [{ ...draft, weighted_score: null }] },
  });
  assert.equal(draft.weighted_score, '1.3500');
  db.KpiAssessmentValues.findAll = async () => [];
  await check('/kpi-assessments/7', {}, 200, { success: true, data: { value_order: order, kpi_assessments: [] } });
  for (const id of ['nope', '0', '-1', '1.5']) {
    await check('/kpi-assessments/' + id, {}, 400, { success: false, message: 'value_order_id must be a positive integer' });
  }
  db.ValueOrders.findByPk = async () => null;
  await check('/kpi-assessments/8', {}, 404, { success: false, message: 'Value order not found' });
  db.KpiAssessmentValues.findAll = async (options) => {
    assert.equal(options.include.some((item) => item.as === 'value_order'), true);
    return [{ get: () => ({ ...submitted, value_order: order }) }];
  };
  const KpiService = require('../src/service/kpi.service').default;
  assert.deepEqual(await KpiService.getAssessmentValues({}), [{ ...submitted, value_order: order }]);
  const state = { id: 5, value_order_id: 7, user_value: 4, head_value: 5, submit_value: null, weight: '30.00', weighted_score: null, status: 'DRAFT' };
  db.KpiAssessmentValues.findByPk = async (id) => {
    assert.equal(id, 5);
    return {
      ...state,
      get: () => ({ ...state }),
      update: async (payload) => Object.assign(state, payload),
    };
  };
  await check('/kpi-assessments/5', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"user_value":3}',
  }, 200, { success: true, data: { ...state, user_value: 3 } });
  await check('/kpi-assessments/5/submit', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"submit_value":4}',
  }, 200, { success: true, data: { ...state, submit_value: 4, weighted_score: 1.2, status: 'SUBMITTED' } });
  for (const path of ['/kpis', '/kpi-assessments', '/assessments/7/competency-scores']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    await response.text();
  }
});
