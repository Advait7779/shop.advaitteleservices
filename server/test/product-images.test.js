const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const uploadDir = require('node:fs').mkdtempSync(path.join(os.tmpdir(), 'advait-product-images-'));
process.env.UPLOAD_DIR = uploadDir;

let referencedImage = '';
const dbPath = require.resolve('../src/config/db');
const prisma = {
  product: {
    findFirst: async () => referencedImage ? { id: 'product-1' } : null,
    findUnique: async () => ({ id: 'product-1', primaryImage: '/products/v5-device.jpg', galleryImages: ['/products/v5-device.jpg'] }),
    update: async ({ data }) => ({ id: 'product-1', ...data }),
  },
  productCategory: { findUnique: async () => ({ id: 'vehicle-gps' }) },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: prisma };

const { productImageExists } = require('../src/utils/productImages');
const { pruneUnusedUploads, ORPHAN_AGE_MS } = require('../src/services/uploadCleanup');
const uploadController = require('../src/controllers/adminUploadController');
const productController = require('../src/controllers/adminProductController');
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('upload returns a usable image path, and cleanup protects images still in use', async () => {
  try {
    const uploaded = response();
    await uploadController.uploadProductImage.at(-1)({ file: {
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YbG0xEAAAAASUVORK5CYII=', 'base64'),
    } }, uploaded);
    assert.equal(uploaded.statusCode, 200);
    const { imageUrl } = uploaded.body;
    assert.equal(await productImageExists(imageUrl), true);

    referencedImage = imageUrl;
    const refused = response();
    await uploadController.deleteUnusedProductImage({ body: { imageUrl } }, refused);
    assert.equal(refused.statusCode, 409);
    assert.equal(await productImageExists(imageUrl), true);

    referencedImage = '';
    const removed = response();
    await uploadController.deleteUnusedProductImage({ body: { imageUrl } }, removed);
    assert.equal(removed.statusCode, 200);
    assert.equal(await productImageExists(imageUrl), false);

    const staleUrl = '/products/00000000-0000-4000-8000-000000000001.png';
    const stalePath = path.join(uploadDir, path.basename(staleUrl));
    await fs.writeFile(stalePath, Buffer.from('89504e470d0a1a0a', 'hex'));
    const oldTime = new Date(Date.now() - ORPHAN_AGE_MS - 60_000);
    await fs.utimes(stalePath, oldTime, oldTime);
    referencedImage = staleUrl;
    assert.equal(await pruneUnusedUploads(), 0);
    assert.equal(await productImageExists(staleUrl), true);
    referencedImage = '';
    assert.equal(await pruneUnusedUploads(), 1);
    assert.equal(await productImageExists(staleUrl), false);
  } finally {
    await fs.rm(uploadDir, { recursive: true, force: true });
  }
});

test('catalog rejects missing and external image paths before saving', async () => {
  for (const image of ['/products/missing.png', 'https://example.com/image.png', '/products/../secret.png']) {
    const res = response();
    await productController.updateProductAdmin({ params: { id: 'product-1' }, body: { primaryImage: image } }, res);
    assert.equal(res.statusCode, 400, image);
  }
  const bundled = response();
  await productController.updateProductAdmin({ params: { id: 'product-1' }, body: { primaryImage: '/products/a5-device.jpg' } }, bundled);
  assert.equal(bundled.statusCode, 200);
  assert.deepEqual(bundled.body.product.galleryImages, ['/products/a5-device.jpg']);
});
