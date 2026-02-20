import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
    const hashedPassword = await bcrypt.hash('K9#xL3@vQ7!mT2$z', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password_hash: hashedPassword,
            must_change_password: false,
            role: Role.ADMIN
        },
        create: {
            email: adminEmail,
            name: 'Arena Admin',
            password_hash: hashedPassword,
            role: Role.ADMIN,
            must_change_password: false
        },
    });

    console.log("Database seeded successfully with ADMIN user:", admin.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
