const prisma = require('../config/db');

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const [statusCounts, stockCounts, totalCustomers, recentOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.product.groupBy({ by: ['inStock'], _count: { id: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true,
          user: {
            select: { fullName: true, mobileNumber: true },
          },
          items: {
            take: 1,
            select: { productTitle: true },
          },
        },
      }),
    ]);

    const statusMap = {
      PENDING: 0,
      FAILED: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let totalOrders = 0;
    let totalRevenue = 0;
    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count.id;
      totalOrders += item._count.id;
      if (['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(item.status)) {
        totalRevenue += item._sum.totalAmount || 0;
      }
    });
    const totalProducts = stockCounts.reduce((sum, item) => sum + item._count.id, 0);
    const inStockProducts = stockCounts.find((item) => item.inStock)?._count.id || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        statusCounts: statusMap,
        totalProducts,
        inStockProducts,
        outOfStockProducts: totalProducts - inStockProducts,
        totalCustomers,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics.' });
  }
};
