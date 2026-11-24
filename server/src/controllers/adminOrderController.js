const prisma = require('../config/db');
const smsService = require('../services/smsService');
const { parsePagination } = require('../utils/pagination');
const publicUserFields = { id: true, email: true, fullName: true, mobileNumber: true,
  addressLine1: true, addressLine2: true, city: true, pincode: true, role: true };
const safeOrder = ({ checkoutKey, cartSnapshot, razorpaySignature, ...order }) => order;

// GET all orders
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    let pagination;
    try { pagination = parsePagination(req.query, { defaultLimit: 25 }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const { page, limit, skip } = pagination;

    let where = {};

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { mobileNumber: { contains: search } } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true, orderNumber: true, createdAt: true, totalAmount: true,
          status: true, courierName: true, trackingNumber: true,
          user: {
            select: {
              id: true,
              fullName: true,
              mobileNumber: true,
              email: true,
              city: true,
              pincode: true,
            },
          },
          items: {
            select: { id: true, productTitle: true, planDuration: true, quantity: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      totalCount,
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      hasNextPage: page * limit < totalCount,
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};

// GET single order
exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        user: { select: publicUserFields },
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, order: safeOrder(order) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
};

// UPDATE order status & tracking info
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierName, notes } = req.body;

    const validStatuses = ['PENDING', 'FAILED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: publicUserFields } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const nextStatus = status?.toUpperCase();
    const allowedTransitions = {
      PENDING: ['CANCELLED'], FAILED: ['CANCELLED'], PAID: ['PROCESSING'],
      PROCESSING: ['SHIPPED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [],
    };
    if (nextStatus && nextStatus !== existing.status && !allowedTransitions[existing.status]?.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: `Cannot change ${existing.status} to ${nextStatus}.` });
    }
    if (nextStatus === 'SHIPPED') {
      const tracking = trackingNumber ?? existing.trackingNumber;
      const courier = courierName ?? existing.courierName;
      if (typeof tracking !== 'string' || !tracking.trim() || typeof courier !== 'string' || !courier.trim()) {
        return res.status(400).json({ success: false, message: 'Courier and tracking number are required before shipping.' });
      }
    }

    const updateData = {};
    if (nextStatus) updateData.status = nextStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber ? trackingNumber.trim() : null;
    if (courierName !== undefined) updateData.courierName = courierName ? courierName.trim() : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    const updated = await prisma.order.update({
      where: { id, status: existing.status },
      data: updateData,
      include: {
        user: { select: publicUserFields },
        items: true,
      },
    });

    // If order was marked as SHIPPED with a tracking number, notify customer
    let shipmentSmsSent = null;
    if (nextStatus === 'SHIPPED' && existing.status !== 'SHIPPED' && updated.trackingNumber && existing.user?.mobileNumber) {
      try {
        const msg = `Your Advait Teleservices order #${updated.orderNumber} has shipped via ${updated.courierName || 'Courier'}. Tracking No: ${updated.trackingNumber}. Thank you!`;
        const result = await smsService.sendCustomSms(existing.user.mobileNumber, msg);
        shipmentSmsSent = result.success;
        if (!result.success) console.warn('Shipment SMS delivery failed:', result.error);
      } catch (err) {
        shipmentSmsSent = false;
        console.warn('SMS dispatch failed (non-blocking):', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${updated.status}.${shipmentSmsSent === false ? ' Shipment SMS could not be delivered; contact the customer manually.' : ''}`,
      shipmentSmsSent,
      order: safeOrder(updated),
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};
