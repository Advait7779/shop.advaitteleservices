const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
let saved;
let listArgs;
const prisma = {
  quoteRequest: {
    create: async ({ data }) => { saved = data; return { id: 'q1', ...data }; },
    findMany: async (args) => { listArgs = args; return [{ id: 'q1', status: 'NEW' }]; },
    count: async () => 26,
    update: async ({ where, data }) => ({ id: where.id, ...data }),
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
const controller = require('../src/controllers/quoteController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('quote form validates required fields and stores only clean data', async () => {
  saved = undefined;
  const bad = response();
  await controller.createQuote({ body: { name: 'A', email: 'invalid', subject: 'Hi', message: 'Short' } }, bad);
  assert.equal(bad.statusCode, 400);
  assert.equal(saved, undefined);

  const good = response();
  await controller.createQuote({ body: {
    name: '  Customer  ', email: '  BUYER@EXAMPLE.COM ', phone: '',
    subject: '  Fleet tracking  ', message: '  Need ten devices for our fleet.  ',
  } }, good);
  assert.equal(good.statusCode, 201);
  assert.deepEqual(saved, {
    name: 'Customer', email: 'buyer@example.com', phone: null,
    subject: 'Fleet tracking', message: 'Need ten devices for our fleet.',
  });
});

test('admin quote inbox uses bounded pagination and validates status updates', async () => {
  const list = response();
  await controller.listQuotesAdmin({ query: { page: '2', status: 'NEW' } }, list);
  assert.equal(list.statusCode, 200);
  assert.equal(listArgs.skip, 25);
  assert.equal(listArgs.take, 25);
  assert.deepEqual(listArgs.where, { status: 'NEW' });
  assert.equal(list.body.totalPages, 2);

  const bad = response();
  await controller.updateQuoteStatusAdmin({ params: { id: 'q1' }, body: { status: 'DELETED' } }, bad);
  assert.equal(bad.statusCode, 400);
  const good = response();
  await controller.updateQuoteStatusAdmin({ params: { id: 'q1' }, body: { status: 'CONTACTED' } }, good);
  assert.equal(good.body.quote.status, 'CONTACTED');
});
