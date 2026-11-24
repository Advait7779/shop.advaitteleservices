const express = require('express');
const rateLimit = require('../middleware/rateLimit');
const { createQuote } = require('../controllers/quoteController');
const router = express.Router();

router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), createQuote);

module.exports = router;
