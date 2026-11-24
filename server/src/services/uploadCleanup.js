const fs = require('fs/promises');
const path = require('path');
const prisma = require('../config/db');
const { uploadDir, uploadedImagePath } = require('../utils/productImages');

const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

async function removeUnusedUploadedImage(imageUrl) {
  const filePath = uploadedImagePath(imageUrl);
  if (!filePath) return false;
  const inUse = await prisma.product.findFirst({
    where: { OR: [{ primaryImage: imageUrl }, { galleryImages: { has: imageUrl } }] },
    select: { id: true },
  });
  if (inUse) return false;
  await fs.unlink(filePath).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  return true;
}

async function pruneUnusedUploads(now = Date.now()) {
  let files;
  try {
    files = await fs.readdir(uploadDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    throw error;
  }
  let removed = 0;
  for (const file of files) {
    if (!file.isFile()) continue;
    const imageUrl = `/products/${file.name}`;
    if (!uploadedImagePath(imageUrl)) continue;
    try {
      const stats = await fs.stat(path.join(uploadDir, file.name));
      if (now - stats.mtimeMs >= ORPHAN_AGE_MS && await removeUnusedUploadedImage(imageUrl)) removed += 1;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return removed;
}

module.exports = { removeUnusedUploadedImage, pruneUnusedUploads, ORPHAN_AGE_MS };
