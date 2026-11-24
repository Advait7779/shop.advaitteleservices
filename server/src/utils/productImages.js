const fs = require('fs/promises');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../uploads/products');
const bundledDir = path.resolve(__dirname, '../../../client/public/products');
const productImagePattern = /^\/products\/([a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp))$/i;
const uploadedImagePattern = /^\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

async function productImageExists(imageUrl) {
  if (typeof imageUrl !== 'string') return false;
  const match = productImagePattern.exec(imageUrl.trim());
  if (!match) return false;
  for (const dir of [uploadDir, bundledDir]) {
    try {
      if ((await fs.stat(path.join(dir, match[1]))).isFile()) return true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return false;
}

function uploadedImagePath(imageUrl) {
  return typeof imageUrl === 'string' && uploadedImagePattern.test(imageUrl)
    ? path.join(uploadDir, path.basename(imageUrl)) : null;
}

module.exports = { uploadDir, productImageExists, uploadedImagePath };
