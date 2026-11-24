const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');
const { productImageExists } = require('../utils/productImages');
const { removeUnusedUploadedImage } = require('../services/uploadCleanup');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
const validPrice = (value) => Number.isFinite(Number(value)) && Number(value) >= 1 &&
  Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.000001;

// GET all products for Admin
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { search, stock } = req.query;
    let pagination;
    try { pagination = parsePagination(req.query, { defaultLimit: 25 }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const { page, limit, skip } = pagination;
    let where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stock === 'in_stock') where.inStock = true;
    if (stock === 'out_of_stock') where.inStock = false;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip,
        select: {
          id: true, slug: true, title: true, subtitle: true, category: true,
          originalPrice: true, sellingPrice: true, discountPercent: true,
          planOptions: true, primaryImage: true, inStock: true, updatedAt: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      count: totalCount,
      totalCount,
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      hasNextPage: page * limit < totalCount,
      products,
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
};

// GET single product
exports.getProductByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve product.' });
  }
};

// CREATE new product
exports.createProductAdmin = async (req, res) => {
  try {
    const {
      title,
      category,
      slug: customSlug,
      subtitle,
      originalPrice,
      sellingPrice,
      planOptions,
      primaryImage,
      galleryImages,
      description,
      features,
      specs,
      whatsInBox,
      inStock,
    } = req.body;

    if (!title || sellingPrice === undefined || !primaryImage || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, selling price, primary image, and description are required.',
      });
    }
    if (!(await productImageExists(primaryImage))) {
      return res.status(400).json({ success: false, message: 'Choose an uploaded or existing product image that can be loaded.' });
    }
    const selectedCategory = category || 'vehicle-gps';
    if (typeof selectedCategory !== 'string' || !(await prisma.productCategory.findUnique({ where: { id: selectedCategory }, select: { id: true } }))) {
      return res.status(400).json({ success: false, message: 'Select a valid product category.' });
    }
    if (!validPrice(sellingPrice) || (originalPrice !== undefined && !validPrice(originalPrice))) {
      return res.status(400).json({ success: false, message: 'Prices must be positive amounts with at most two decimal places.' });
    }

    const orig = originalPrice !== undefined ? Number(originalPrice) : Number(sellingPrice);
    const sell = parseFloat(sellingPrice);
    const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;

    let slug = customSlug ? slugify(customSlug) : slugify(title);

    // Ensure unique slug
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure array formats
    const formattedPlans = Array.isArray(planOptions)
      ? planOptions
      : typeof planOptions === 'string'
      ? planOptions.split(',').map((s) => s.trim()).filter(Boolean)
      : ['1 Year'];

    const formattedFeatures = Array.isArray(features)
      ? features
      : typeof features === 'string'
      ? features.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const formattedWhatsInBox = Array.isArray(whatsInBox)
      ? whatsInBox
      : typeof whatsInBox === 'string'
      ? whatsInBox.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const formattedGallery = Array.isArray(galleryImages)
      ? galleryImages
      : primaryImage
      ? [primaryImage]
      : [];

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        category: selectedCategory,
        slug,
        subtitle: subtitle?.trim() || null,
        originalPrice: orig,
        sellingPrice: sell,
        discountPercent: discount,
        planOptions: formattedPlans.length ? formattedPlans : ['1 Year'],
        primaryImage: primaryImage.trim(),
        galleryImages: formattedGallery,
        description: description.trim(),
        features: formattedFeatures,
        specs: specs && typeof specs === 'object' ? specs : {},
        whatsInBox: formattedWhatsInBox,
        inStock: typeof inStock === 'boolean' ? inStock : true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// UPDATE existing product
exports.updateProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      slug: customSlug,
      subtitle,
      originalPrice,
      sellingPrice,
      planOptions,
      primaryImage,
      galleryImages,
      description,
      features,
      specs,
      whatsInBox,
      inStock,
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = {};

    if (category !== undefined) {
      if (typeof category !== 'string' || !(await prisma.productCategory.findUnique({ where: { id: category }, select: { id: true } }))) {
        return res.status(400).json({ success: false, message: 'Select a valid product category.' });
      }
      updateData.category = category;
    }

    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (primaryImage !== undefined) {
      if (!(await productImageExists(primaryImage))) {
        return res.status(400).json({ success: false, message: 'Choose an uploaded or existing product image that can be loaded.' });
      }
      updateData.primaryImage = primaryImage.trim();
      if (primaryImage !== existing.primaryImage && galleryImages === undefined) {
        updateData.galleryImages = existing.galleryImages.length
          ? existing.galleryImages.map((image) => image === existing.primaryImage ? updateData.primaryImage : image)
          : [updateData.primaryImage];
      }
    }

    if (sellingPrice !== undefined || originalPrice !== undefined) {
      if ((sellingPrice !== undefined && !validPrice(sellingPrice)) || (originalPrice !== undefined && !validPrice(originalPrice))) {
        return res.status(400).json({ success: false, message: 'Prices must be positive amounts with at most two decimal places.' });
      }
      const orig = originalPrice !== undefined ? parseFloat(originalPrice) : existing.originalPrice;
      const sell = sellingPrice !== undefined ? parseFloat(sellingPrice) : existing.sellingPrice;
      updateData.originalPrice = orig;
      updateData.sellingPrice = sell;
      updateData.discountPercent = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
    }

    if (customSlug && customSlug !== existing.slug) {
      let slug = slugify(customSlug);
      const conflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (conflict) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      updateData.slug = slug;
    }

    if (planOptions !== undefined) {
      updateData.planOptions = Array.isArray(planOptions)
        ? planOptions
        : typeof planOptions === 'string'
        ? planOptions.split(',').map((s) => s.trim()).filter(Boolean)
        : ['1 Year'];
    }

    if (galleryImages !== undefined) {
      updateData.galleryImages = Array.isArray(galleryImages) ? galleryImages : [updateData.primaryImage || existing.primaryImage];
    }

    if (features !== undefined) {
      updateData.features = Array.isArray(features)
        ? features
        : typeof features === 'string'
        ? features.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (whatsInBox !== undefined) {
      updateData.whatsInBox = Array.isArray(whatsInBox)
        ? whatsInBox
        : typeof whatsInBox === 'string'
        ? whatsInBox.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (specs !== undefined) {
      updateData.specs = typeof specs === 'object' ? specs : {};
    }

    if (inStock !== undefined) {
      if (typeof inStock !== 'boolean') return res.status(400).json({ success: false, message: 'inStock must be a boolean.' });
      updateData.inStock = inStock;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// QUICK TOGGLE inStock
exports.toggleStockAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { inStock: !existing.inStock },
    });

    return res.status(200).json({
      success: true,
      message: `Product is now ${updated.inStock ? 'In Stock' : 'Out of Stock'}.`,
      product: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle stock status.' });
  }
};

// DELETE product
exports.deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product is in any order
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      // If part of past orders, mark inactive / out of stock instead of hard deleting to preserve order history integrity
      const updated = await prisma.product.update({
        where: { id },
        data: { inStock: false },
      });
      return res.status(200).json({
        success: true,
        message: 'Product has linked customer orders. It has been marked as Out of Stock / Inactive to preserve historical order records.',
        product: updated,
      });
    }

    const deleted = await prisma.product.delete({ where: { id } });
    await removeUnusedUploadedImage(deleted.primaryImage).catch((error) => console.warn('Could not clean up deleted product image:', error));
    return res.status(200).json({ success: true, message: 'Product deleted permanently.' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
