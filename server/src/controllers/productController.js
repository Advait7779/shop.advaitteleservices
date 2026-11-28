const prisma = require('../config/db');
const { parsePagination } = require('../utils/pagination');
const { isGpsProduct, SIM_OPTION_CARDS, summarizeReviews } = require('../utils/productOptions');

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
          rating: true, reviewCount: true,
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
        OR: [{ slug }, { id: slug }],
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let reviews = [];
    if (prisma.productReview?.findMany) {
      reviews = await prisma.productReview.findMany({
        where: { productId: product.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: {
          id: true,
          reviewerName: true,
          reviewerCity: true,
          vehicleOrUse: true,
          rating: true,
          title: true,
          comment: true,
          verifiedPurchase: true,
          createdAt: true,
        },
      });
    }

    const ratingSummary = reviews.length > 0
      ? summarizeReviews(reviews)
      : { average: product.rating || 5, total: product.reviewCount || 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        supportsSimOptions: isGpsProduct(product),
        simOptions: isGpsProduct(product) ? SIM_OPTION_CARDS : [],
        rating: ratingSummary.average,
        reviewCount: ratingSummary.total,
        ratingBreakdown: ratingSummary.counts,
        reviews,
      },
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
};

exports.createProductReview = async (req, res) => {
  try {
    const { slug } = req.params;
    const rawRating = Number(req.body?.rating);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    const vehicleOrUse = typeof req.body?.vehicleOrUse === 'string' ? req.body.vehicleOrUse.trim().slice(0, 80) : '';
    const reviewerCity = typeof req.body?.reviewerCity === 'string' && req.body.reviewerCity.trim()
      ? req.body.reviewerCity.trim().slice(0, 80)
      : (req.user.city || '');

    if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
      return res.status(400).json({ success: false, message: 'Select a rating between 1 and 5 stars.' });
    }
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ success: false, message: 'Enter a review title between 3 and 100 characters.' });
    }
    if (comment.length < 8 || comment.length > 800) {
      return res.status(400).json({ success: false, message: 'Write a review comment between 8 and 800 characters.' });
    }

    const product = await prisma.product.findFirst({
      where: { inStock: true, OR: [{ slug }, { id: slug }] },
      select: { id: true, title: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existingPurchase = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId: req.user.id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
      select: { id: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.productReview.create({
        data: {
          productId: product.id,
          userId: req.user.id,
          reviewerName: req.user.fullName || 'Advait Customer',
          reviewerCity: reviewerCity || null,
          vehicleOrUse: vehicleOrUse || null,
          rating: rawRating,
          title,
          comment,
          verifiedPurchase: Boolean(existingPurchase),
        },
        select: {
          id: true,
          reviewerName: true,
          reviewerCity: true,
          vehicleOrUse: true,
          rating: true,
          title: true,
          comment: true,
          verifiedPurchase: true,
          createdAt: true,
        },
      });

      const allReviews = await tx.productReview.findMany({
        where: { productId: product.id },
        select: { rating: true },
      });
      const summary = summarizeReviews(allReviews);
      await tx.product.update({
        where: { id: product.id },
        data: { rating: summary.average, reviewCount: summary.total },
      });

      return { review, summary };
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for sharing your feedback!',
      review: result.review,
      rating: result.summary.average,
      reviewCount: result.summary.total,
      ratingBreakdown: result.summary.counts,
    });
  } catch (error) {
    console.error('Create product review error:', error);
    return res.status(500).json({ success: false, message: 'Could not submit your review. Please try again.' });
  }
};
