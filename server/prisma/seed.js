require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { productImageExists } = require('../src/utils/productImages');
const products = require('./products.seed.json');

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

  console.log(`Current catalog: ${products.length} products. Added: ${result.count}. Existing products were not changed.`);
}

main()
  .catch((error) => {
    console.error('Product seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
