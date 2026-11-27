const prisma = require('../config/db');

exports.getCart = async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const subtotal = items.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);

    return res.status(200).json({
      success: true,
      items,
      itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve cart.' });
  }
};

exports.mergeCart = async (req, res) => {
  try {
    const input = req.body?.items;
    if (!Array.isArray(input) || input.length > 50) {
      return res.status(400).json({ success: false, message: 'Invalid cart items.' });
    }
    const quantities = new Map();
    for (const item of input) {
      if (!item || typeof item.productId !== 'string' ||
          typeof item.planDuration !== 'string' || !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 || item.quantity > 100) {
        return res.status(400).json({ success: false, message: 'Invalid cart item.' });
      }
      const key = `${item.productId}\u0000${item.planDuration}`;
      const total = (quantities.get(key)?.quantity || 0) + item.quantity;
      if (total > 100) return res.status(400).json({ success: false, message: 'Maximum quantity is 100 per item.' });
      quantities.set(key, { productId: item.productId, planDuration: item.planDuration, quantity: total });
    }
    const items = [...quantities.values()];
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.inStock || !product.planOptions.includes(item.planDuration)) {
          throw new Error('UNAVAILABLE_CART_ITEM');
        }
        const where = { userId_productId_planDuration: {
          userId: req.user.id, productId: item.productId, planDuration: item.planDuration,
        } };
        const existing = await tx.cartItem.findUnique({ where });
        if (existing) {
          // Retried syncs must not add the guest quantity twice.
          await tx.cartItem.update({ where: { id: existing.id }, data: {
            quantity: Math.max(existing.quantity, item.quantity),
          } });
        } else {
          await tx.cartItem.create({ data: { userId: req.user.id, ...item } });
        }
      }
    });
    return res.json({ success: true });
  } catch (error) {
    if (error.message === 'UNAVAILABLE_CART_ITEM') {
      return res.status(409).json({ success: false, message: 'An item in your cart is no longer available. Please remove it and try again.' });
    }
    console.error('Merge cart error:', error);
    return res.status(500).json({ success: false, message: 'Could not sync your cart. Please try again.' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, planDuration = '1 Year', quantity = 1 } = req.body;
    const count = Number(quantity);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (!product.inStock || !product.planOptions.includes(planDuration) || !Number.isSafeInteger(count) || count < 1 || count > 100) {
      return res.status(400).json({ success: false, message: 'Invalid quantity, plan, or unavailable product.' });
    }

    // Upsert or increment
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId_planDuration: {
          userId: req.user.id,
          productId,
          planDuration,
        },
      },
    });

    let cartItem;
    if (existing) {
      if (existing.quantity + count > 100) return res.status(400).json({ success: false, message: 'Maximum quantity is 100.' });
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: count } },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          planDuration,
          quantity: count,
        },
        include: { product: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: `${product.title} added to your cart!`,
      cartItem,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, planDuration } = req.body;

    const existing = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const count = quantity !== undefined ? Number(quantity) : existing.quantity;
    if (!Number.isSafeInteger(count) || count < 0 || count > 100) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number from 0 to 100.' });
    }
    if (planDuration) {
      const product = await prisma.product.findUnique({ where: { id: existing.productId } });
      if (!product || !product.inStock || !product.planOptions.includes(planDuration)) {
        return res.status(400).json({ success: false, message: 'Selected plan is unavailable.' });
      }
    }
    if (quantity !== undefined && count === 0) {
      await prisma.cartItem.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Item removed from cart.' });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: count }),
        ...(planDuration && { planDuration }),
      },
      include: { product: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated.',
      cartItem: updated,
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    await prisma.cartItem.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item.' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    return res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};
