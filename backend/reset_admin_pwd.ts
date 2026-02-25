import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.updateMany({
        where: { email: 'founder@codearena.gpcet.ac.in' },
        data: {
            password_hash: hash,
            failed_attempts: 0,
            locked_until: null
        },
    });
    console.log('Password successfully reset to admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
