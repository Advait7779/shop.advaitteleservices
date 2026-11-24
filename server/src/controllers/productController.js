const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');

exports.getAllProducts = async (req, res) => {
  try {
    const { sort, search, category } = req.query;
    if (category && (typeof category !== 'string' || !(await prisma.productCategory.findUnique({ where: { id: category }, select: { id: true } })))) {
      return res.status(400).json({ success: false, message: 'Unknown product category.' });
    }
    let pagination;
    try { pagination = parsePagination(req.query, { defaultLimit: 24 }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const { page, limit, skip } = pagination;

    let orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
    if (sort === 'price-asc') orderBy = [{ sellingPrice: 'asc' }, { id: 'asc' }];
    if (sort === 'price-desc') orderBy = [{ sellingPrice: 'desc' }, { id: 'desc' }];
    if (sort === 'name-asc') orderBy = [{ title: 'asc' }, { id: 'asc' }];

    const where = { inStock: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true, slug: true, title: true, subtitle: true, description: true,
          category: true,
          originalPrice: true, sellingPrice: true, discountPercent: true,
          planOptions: true, primaryImage: true, inStock: true,
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
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        inStock: true,
        OR: [{ slug: slug }, { id: slug }],
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
};
