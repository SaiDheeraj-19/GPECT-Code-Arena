import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in').toLowerCase();
    const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'K9#xL3@vQ7!mT2$z';
    const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password_hash: hashedPassword,
            must_change_password: false,
            role: Role.ADMIN,
            failed_attempts: 0,
            locked_until: null
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
    // Give points to Test Student 1 to unlock interview questions
    const testStudent1 = await prisma.user.upsert({
        where: { roll_number: '24ATA05269' },
        update: {
            password_hash: studentPass,
            failed_attempts: 0,
            locked_until: null,
            // @ts-ignore
            points: 12500,
            streak: 7
        },
        create: {
            name: 'Elite Student',
            roll_number: '24ATA05269',
            password_hash: studentPass,
            role: Role.STUDENT,
            must_change_password: false,
            // @ts-ignore
            points: 12500,
            streak: 7
        }
    });

    const testStudent2 = await prisma.user.upsert({
        where: { roll_number: '24ATA05063' },
        update: {
            password_hash: studentPass,
            failed_attempts: 0,
            locked_until: null,
            // @ts-ignore
            points: 450,
            streak: 1
        },
        create: {
            name: 'Novice Student',
            roll_number: '24ATA05063',
            password_hash: studentPass,
            role: Role.STUDENT,
            must_change_password: false,
            // @ts-ignore
            points: 450,
            streak: 1
        }
    });

    // Add some sample problems
    await prisma.problem.upsert({
        where: { id: 'interview-1' },
        update: {},
        create: {
            id: 'interview-1',
            title: 'Two Sum Elite',
            description: 'Determine if two numbers sum to target in an array representing an infinite stream.',
            difficulty: 'Easy',
            // @ts-ignore
            problem_type: 'INTERVIEW',
            tags: ['Array', 'Hashing', 'Google'],
            allowed_languages: ['python', 'javascript', 'cpp'],
            created_by: admin.id,
            testCases: {
                create: [
                    { input: '[2,7,11,15]\n9', expected_output: '[0,1]' }
                ]
            }
        }
    });

    await prisma.problem.upsert({
        where: { id: 'interview-2' },
        update: {},
        create: {
            id: 'interview-2',
            title: 'Reverse Linked List Optimized',
            description: 'Reverse a linked list using constant extra space.',
            difficulty: 'Medium',
            // @ts-ignore
            problem_type: 'INTERVIEW',
            tags: ['Linked List', 'Amazon'],
            allowed_languages: ['python', 'cpp', 'java'],
            created_by: admin.id,
            testCases: {
                create: [
                    { input: '[1,2,3,4,5]', expected_output: '[5,4,3,2,1]' }
                ]
            }
        }
    });

    console.log("Database seeded successfully with ADMIN user:", admin.email);
    console.log("Database seeded successfully with TEST STUDENTS:", testStudent1.roll_number, ",", testStudent2.roll_number);
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
