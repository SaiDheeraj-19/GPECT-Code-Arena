import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('K9#xL3@vQ7!mT2$z', 10);
  await prisma.user.updateMany({
    where: { email: 'founder@codearena.gpcet.ac.in' },
    data: { password_hash: hash },
  });
  console.log('Password updated successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
