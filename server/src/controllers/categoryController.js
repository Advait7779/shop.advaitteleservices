const prisma = require('../config/db');

const slugifyCategory = (label) => label.toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, label: true },
    });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load product categories.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const label = typeof req.body?.label === 'string' ? req.body.label.trim().replace(/\s+/g, ' ') : '';
    const id = slugifyCategory(label);
    if (label.length < 2 || label.length > 60 || id.length < 2 || id.length > 64) {
      return res.status(400).json({ success: false, message: 'Enter a category name of 2–60 letters or numbers.' });
    }
    const existing = await prisma.productCategory.findFirst({ where: { OR: [
      { id }, { label: { equals: label, mode: 'insensitive' } },
    ] } });
    if (existing) return res.status(409).json({ success: false, message: 'This category already exists.' });

    const last = await prisma.productCategory.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const category = await prisma.productCategory.create({
      data: { id, label, sortOrder: (last?.sortOrder ?? -1) + 1 },
      select: { id: true, label: true },
    });
    return res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'This category already exists.' });
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product category.' });
  }
};
