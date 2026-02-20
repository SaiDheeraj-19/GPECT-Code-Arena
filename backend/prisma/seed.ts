import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
    const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'K9#xL3@vQ7!mT2$z';
    const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);

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

    const studentPass = await bcrypt.hash('Gpcet@codeATA', 10);
    const testStudent = await prisma.user.upsert({
        where: { roll_number: '24ATA05269' },
        update: { password_hash: studentPass },
        create: {
            name: 'Test Student',
            roll_number: '24ATA05269',
            password_hash: studentPass,
            role: Role.STUDENT,
            must_change_password: false // For testing ease
        }
    });

    console.log("Database seeded successfully with ADMIN user:", admin.email);
    console.log("Database seeded successfully with TEST STUDENT:", testStudent.roll_number);
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
