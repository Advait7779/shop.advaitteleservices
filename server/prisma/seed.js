require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { productImageExists } = require('../src/utils/productImages');
const { summarizeReviews } = require('../src/utils/productOptions');
const products = require('./products.seed.json');
const reviewsBySlug = require('./productReviews.seed.json');

const prisma = new PrismaClient();

async function main() {
  for (const product of products) {
    const images = [product.primaryImage, ...product.galleryImages];
    for (const image of images) {
      if (!(await productImageExists(image))) {
        throw new Error(`Missing product image for ${product.slug}: ${image}`);
      }
    }
  }

  const result = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  if (process.env.SYNC_PRODUCT_INFO === 'true') {
    for (const product of products) {
      await prisma.product.updateMany({
        where: { slug: product.slug },
        data: {
          category: product.category,
          subtitle: product.subtitle,
          description: product.description,
          features: product.features,
          specs: product.specs,
          whatsInBox: product.whatsInBox,
          manufacturerInfo: product.manufacturerInfo,
        },
      });
    }
  }

  let addedReviews = 0;
  for (const product of products) {
    const dbProduct = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (!dbProduct) continue;

    const existingReviews = await prisma.productReview.count({ where: { productId: dbProduct.id } });
    const seedReviews = reviewsBySlug[product.slug] || [];
    if (existingReviews === 0 && seedReviews.length > 0) {
      const now = Date.now();
      await prisma.productReview.createMany({
        data: seedReviews.map((entry, idx) => ({
          productId: dbProduct.id,
          reviewerName: entry.reviewerName,
          reviewerCity: entry.reviewerCity || null,
          vehicleOrUse: entry.vehicleOrUse || null,
          rating: entry.rating,
          title: entry.title,
          comment: entry.comment,
          verifiedPurchase: entry.verifiedPurchase !== false,
          createdAt: new Date(now - (entry.daysAgo || (idx + 1) * 14) * 86400 * 1000),
        })),
      });
      addedReviews += seedReviews.length;
    }

    const allReviews = await prisma.productReview.findMany({
      where: { productId: dbProduct.id },
      select: { rating: true },
    });
    if (allReviews.length > 0) {
      const { average, total } = summarizeReviews(allReviews);
      await prisma.product.update({
        where: { id: dbProduct.id },
        data: { rating: average, reviewCount: total },
      });
    }
  }

  console.log(
    `Catalog synced (${products.length} products, newly added: ${result.count}, newly seeded reviews: ${addedReviews}).`
  );
}

main()
  .catch((error) => {
    console.error('Product seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
