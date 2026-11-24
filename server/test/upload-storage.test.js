const test = require('node:test');
const assert = require('node:assert/strict');
const validateUploadStorage = require('../src/config/validateUploadStorage');

const options = {
  nodeEnv: 'production',
  platform: 'linux',
  directory: '/app/uploads/products',
  access: () => {},
};

test('production requires a writable persistent upload mount', () => {
  assert.throws(() => validateUploadStorage({ ...options, mountInfo: '1 0 0:1 / / rw - overlay overlay rw' }), /persistent volume/);
  assert.doesNotThrow(() => validateUploadStorage({ ...options, mountInfo: '1 0 0:1 / / rw - overlay overlay rw\n2 1 0:2 / /app/uploads/products rw - ext4 /dev/sda rw' }));
  assert.doesNotThrow(() => validateUploadStorage({ ...options, mountInfo: '1 0 0:1 / / rw - overlay overlay rw\n2 1 0:2 / /app/uploads rw - ext4 /dev/sda rw' }));
  assert.throws(() => validateUploadStorage({ ...options, mountInfo: '2 1 0:2 / /app/uploads/products rw - ext4 /dev/sda rw', access: () => { throw new Error('read only'); } }), /read only/);
});
