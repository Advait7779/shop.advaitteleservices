const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');

exports.getAllCustomersAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    let pagination;
    try { pagination = parsePagination(req.query, { defaultLimit: 25 }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const { page, limit, skip } = pagination;
    let where = { role: 'CUSTOMER' };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
        { pincode: { contains: search } },
      ];
    }

    const [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip,
        select: {
          id: true, fullName: true, mobileNumber: true, email: true,
          addressLine1: true, addressLine2: true, city: true, pincode: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customerIds = customers.map((customer) => customer.id);
    const [orderCounts, paidTotals] = customerIds.length ? await Promise.all([
      prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: customerIds } },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['userId'],
        where: {
          userId: { in: customerIds },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { totalAmount: true },
      }),
    ]) : [[], []];
    const countByUser = new Map(orderCounts.map((row) => [row.userId, row._count.id]));
    const spendByUser = new Map(paidTotals.map((row) => [row.userId, row._sum.totalAmount || 0]));

    const formatted = customers.map((c) => {

      return {
        id: c.id,
        fullName: c.fullName,
        mobileNumber: c.mobileNumber,
        email: c.email,
        addressLine1: c.addressLine1,
        addressLine2: c.addressLine2,
        city: c.city,
        pincode: c.pincode,
        registeredAt: c.createdAt,
        totalOrders: countByUser.get(c.id) || 0,
        totalSpent: spendByUser.get(c.id) || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: totalCount,
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      hasNextPage: page * limit < totalCount,
      customers: formatted,
    });
  } catch (error) {
    console.error('Admin get customers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
};
