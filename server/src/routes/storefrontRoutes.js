const router = require('express').Router();
const prisma = require('../config/db');
const { sharedAuthLimit } = require('../services/authThrottle');

const startingCount = 100_000;
const counterKey = { id: 'storefront' };
const visitIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post('/views', sharedAuthLimit('storefront-views', 120, 60_000), async (req, res) => {
  const { visitId } = req.body || {};
  if (typeof visitId !== 'string' || visitId.length !== 36 || !visitIdPattern.test(visitId)) {
    return res.status(400).json({ success: false, message: 'Invalid visit identifier.' });
  }

  const { recorded } = await prisma.$transaction(async (tx) => {
    const entry = await tx.storefrontVisit.createMany({
      data: { id: visitId },
      skipDuplicates: true,
    });
    if (entry.count === 0) return tx.storefrontViewCounter.findUniqueOrThrow({ where: counterKey });
    return tx.storefrontViewCounter.update({ where: counterKey, data: { recorded: { increment: 1 } } });
  });

  return res.json({ total: startingCount + recorded, startingCount });
});

module.exports = router;
