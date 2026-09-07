import { PrismaClient } from '@prisma/client';

export async function ensureUser(
  prisma: PrismaClient,
  phone: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    return existingUser;
  }

  try {
    return await prisma.user.create({
      data: { phone },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return prisma.user.findUniqueOrThrow({
        where: { phone },
      });
    }

    throw error;
  }
}