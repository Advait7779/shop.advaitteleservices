const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.createQuote = async (req, res) => {
  const body = req.body || {};
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const subject = clean(body.subject);
  const message = clean(body.message);

  // Quietly accept automated submissions caught by the hidden field.
  if (clean(body.website)) return res.status(201).json({ success: true });
  if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || email.length > 254 ||
      phone.length > 25 || subject.length < 3 || subject.length > 150 ||
      message.length < 10 || message.length > 5000) {
    return res.status(400).json({ success: false, message: 'Please check your name, email, subject, and message.' });
  }

  try {
    await prisma.quoteRequest.create({ data: { name, email, phone: phone || null, subject, message } });
    return res.status(201).json({ success: true, message: 'Your request was received.' });
  } catch (error) {
    console.error('Create quote error:', error);
    return res.status(500).json({ success: false, message: 'Could not save your request. Please try again.' });
  }
};

exports.listQuotesAdmin = async (req, res) => {
  let pagination;
  try { pagination = parsePagination(req.query, { defaultLimit: 25 }); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  const status = clean(req.query.status).toUpperCase();
  if (status && !['NEW', 'CONTACTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid quote status.' });
  }
  const where = status ? { status } : {};
  try {
    const [quotes, count] = await Promise.all([
      prisma.quoteRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: pagination.limit, skip: pagination.skip }),
      prisma.quoteRequest.count({ where }),
    ]);
    return res.json({ success: true, quotes, count, page: pagination.page, totalPages: Math.max(1, Math.ceil(count / pagination.limit)) });
  } catch (error) {
    console.error('List quotes error:', error);
    return res.status(500).json({ success: false, message: 'Could not load quote requests.' });
  }
};

exports.updateQuoteStatusAdmin = async (req, res) => {
  const status = clean(req.body?.status).toUpperCase();
  if (!['NEW', 'CONTACTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid quote status.' });
  }
  try {
    const quote = await prisma.quoteRequest.update({ where: { id: req.params.id }, data: { status } });
    return res.json({ success: true, quote });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Quote request not found.' });
    console.error('Update quote error:', error);
    return res.status(500).json({ success: false, message: 'Could not update quote request.' });
  }
};
