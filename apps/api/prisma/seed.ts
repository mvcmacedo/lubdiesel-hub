import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Idempotent seed: creates the initial admin user and the two initial products.
 * Prices default to 0 (placeholder) because they are still subject to change (spec §49).
 */
async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lubdiesel.com.br';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Lubdiesel Admin',
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const products = [
    { sku: 'LUB-060', name: 'Lubdiesel 60 ml', volumeMl: 60 },
    { sku: 'LUB-1000', name: 'Lubdiesel 1 L', volumeMl: 1000 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        name: product.name,
        volumeMl: product.volumeMl,
        costPrice: 0,
        salePrice: 0,
        active: true,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
