const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');
const { uploadDir, uploadedImagePath } = require('../utils/productImages');
const { removeUnusedUploadedImage } = require('../services/uploadCleanup');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function extensionFor(buffer) {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return '.jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}

exports.uploadProductImage = [
  upload.single('image'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    const ext = extensionFor(req.file.buffer);
    if (!ext) return res.status(400).json({ success: false, message: 'Upload a JPEG, PNG, or WebP image.' });
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${crypto.randomUUID()}${ext}`;
      await fs.writeFile(path.join(uploadDir, filename), req.file.buffer, { flag: 'wx' });
      return res.json({ success: true, message: 'Product image uploaded.', imageUrl: `/products/${filename}`, filename });
    } catch (error) {
      console.error('Product image upload error:', error);
      return res.status(500).json({ success: false, message: 'Could not save image.' });
    }
  },
];

exports.deleteUnusedProductImage = async (req, res) => {
  const imageUrl = req.body?.imageUrl;
  const filePath = uploadedImagePath(imageUrl);
  if (!filePath) return res.status(400).json({ success: false, message: 'Invalid uploaded image path.' });
  try {
    if (!(await removeUnusedUploadedImage(imageUrl))) {
      return res.status(409).json({ success: false, message: 'This image is still used by a product.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete unused product image error:', error);
    return res.status(500).json({ success: false, message: 'Could not remove unused image.' });
  }
};
