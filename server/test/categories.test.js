const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const categories = [{ id: 'vehicle-gps', label: 'Vehicle GPS', sortOrder: 0 }];
const prisma = {
  productCategory: {
    findMany: async () => categories.map(({ id, label }) => ({ id, label })),
    findFirst: async (args) => args.where
      ? categories.find((category) => category.id === args.where.OR[0].id || category.label.toLowerCase() === args.where.OR[1].label.equals.toLowerCase())
      : categories.at(-1),
    create: async ({ data }) => {
      categories.push(data);
      return { id: data.id, label: data.label };
    },
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };
const controller = require('../src/controllers/categoryController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('admins can create a category that appears in the public list', async () => {
  const created = response();
  await controller.createCategory({ body: { label: '  Dash   Cameras  ' } }, created);
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.body.category, { id: 'dash-cameras', label: 'Dash Cameras' });

  const listed = response();
  await controller.getCategories({}, listed);
  assert.deepEqual(listed.body.categories.map((category) => category.id), ['vehicle-gps', 'dash-cameras']);
});

test('category creation rejects duplicate and unusable names', async () => {
  const duplicate = response();
  await controller.createCategory({ body: { label: 'DASH CAMERAS' } }, duplicate);
  assert.equal(duplicate.statusCode, 409);

  const invalid = response();
  await controller.createCategory({ body: { label: '---' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});
