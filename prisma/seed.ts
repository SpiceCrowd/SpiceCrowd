import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = prisma as any;

async function main() {
  console.log('Seeding initial data...');

  // Create admin/dev user
  await prisma.user.upsert({
    where: { email: 'dev@local' },
    update: {},
    create: { email: 'dev@local', name: 'Dev User' },
  });

  // Categories
  const categories = [
    { name: 'Whole Spices', slug: 'whole-spices' },
    { name: 'Spice Powders', slug: 'spice-powders' },
    { name: 'Coffee', slug: 'coffee' },
  ];

  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { name: c.name, slug: c.slug },
    });
  }

  // Initial product list with a per-kg reference price (in rupees)
  const products = [
    { title: 'Black Pepper', slug: 'black-pepper', category: 'whole-spices', perKg: 1200 },
    { title: 'White Pepper', slug: 'white-pepper', category: 'whole-spices', perKg: 1400 },
    { title: 'Roasted Coffee Beans', slug: 'roasted-coffee-beans', category: 'coffee', perKg: 800 },
    { title: 'Filter Coffee Powder', slug: 'filter-coffee-powder', category: 'coffee', perKg: 600 },
    { title: 'Cinnamon', slug: 'cinnamon', category: 'whole-spices', perKg: 900 },
    { title: 'Cinnamon Powder', slug: 'cinnamon-powder', category: 'spice-powders', perKg: 700 },
    { title: 'Cardamom', slug: 'cardamom', category: 'whole-spices', perKg: 2400 },
    { title: 'Cardamom Powder', slug: 'cardamom-powder', category: 'spice-powders', perKg: 1800 },
    { title: 'Clove', slug: 'clove', category: 'whole-spices', perKg: 1100 },
    { title: 'Bay Leaf', slug: 'bay-leaf', category: 'whole-spices', perKg: 300 },
  ];

  for (const p of products) {
    const category = await db.category.findUnique({ where: { slug: p.category } });
    if (!category) continue;

    // Upsert product with variants for 100g, 250g, 500g, 1kg
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`Product exists: ${p.slug}`);
      continue;
    }

    const product = await db.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        shortDesc: `${p.title} from authentic Indian origins`,
        price: p.perKg,
        category: { connect: { id: category.id } },
        variants: {
          create: [100, 250, 500, 1000].map((w) => ({
            name: `${w} g`,
            weightGram: w,
            price: Math.round((p.perKg * w) / 1000),
            stock: 100,
          })),
        },
        images: {
          create: [{ url: `/images/${p.slug}.jpg`, alt: p.title, order: 0 }],
        },
      } as any,
    });

    console.log(`Created product: ${product.slug}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
