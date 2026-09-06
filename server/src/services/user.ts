import { PrismaClient } from '@prisma/client';

export async function ensureUser(
  prisma: PrismaClient,
  phone: string
) {
  return prisma.user.upsert({
    where: {
      phone,
    },
    update: {},
    create: {
      phone,
    },
  });
}