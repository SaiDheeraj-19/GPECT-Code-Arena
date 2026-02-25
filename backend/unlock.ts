import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({
        where: { email: 'founder@codearena.gpcet.ac.in' },
        data: {
            failed_attempts: 0,
            locked_until: null,
        },
    });
    console.log('Admin account unlocked!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
