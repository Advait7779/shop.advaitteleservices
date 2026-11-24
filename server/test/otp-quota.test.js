const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-only-secret-longer-than-thirty-two-characters';
const { quotaFor, reserve, release, DailyOtpLimitError, secondsUntilReset } = require('../src/services/otpQuota');

const store = () => {
  let committed = new Map();
  const transaction = async (work) => {
    const draft = new Map(committed);
    const tx = {
      otpRequestQuota: {
        createMany: async ({ data }) => {
          for (const { scope, identityHash, day } of data) {
            const key = `${scope}:${identityHash}:${day}`;
            if (!draft.has(key)) draft.set(key, 0);
          }
        },
        updateMany: async ({ where, data }) => {
          const key = `${where.scope}:${where.identityHash}:${where.day}`;
          const count = draft.get(key);
          if (count === undefined || (where.count?.lt !== undefined && count >= where.count.lt) ||
              (where.count?.gt !== undefined && count <= where.count.gt)) return { count: 0 };
          draft.set(key, count + (data.count.increment || 0) - (data.count.decrement || 0));
          return { count: 1 };
        },
      },
    };
    const result = await work(tx);
    committed = draft;
    return result;
  };
  return { transaction };
};

test('five per IP applies across numbers, and five per number applies across IPs', async () => {
  const db = store();
  const day = new Date('2026-11-23T10:00:00.000Z');
  for (let index = 0; index < 5; index += 1) {
    await db.transaction((tx) => reserve(tx, quotaFor('9876543210', '203.0.113.1', day)));
  }
  await assert.rejects(
    db.transaction((tx) => reserve(tx, quotaFor('9123456780', '203.0.113.1', day))),
    DailyOtpLimitError,
  );
  await assert.rejects(
    db.transaction((tx) => reserve(tx, quotaFor('9876543210', '203.0.113.2', day))),
    DailyOtpLimitError,
  );
  await db.transaction((tx) => reserve(tx, quotaFor('9123456780', '203.0.113.2', day)));
  await db.transaction((tx) => reserve(tx, quotaFor('9876543210', '203.0.113.1', new Date('2026-11-23T18:30:00.000Z'))));
});

test('failed SMS releases its daily slots and the day resets at midnight in India', async () => {
  const db = store();
  const now = new Date('2026-11-23T18:29:59.000Z');
  const quota = quotaFor('9876543210', '203.0.113.1', now);
  assert.equal(quota.day, '2026-11-23');
  assert.equal(secondsUntilReset(quota.day, now), 1);
  assert.equal(quotaFor('9876543210', '203.0.113.1', new Date('2026-11-23T18:30:00.000Z')).day, '2026-11-24');
  for (let index = 0; index < 5; index += 1) await db.transaction((tx) => reserve(tx, quota));
  await db.transaction((tx) => release(tx, quota));
  await db.transaction((tx) => reserve(tx, quota));
});
