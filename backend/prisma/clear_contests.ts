import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearContests() {
    try {
        await prisma.participation.deleteMany({});
        await prisma.contest.deleteMany({});
        console.log("All contests and participations cleared successfully.");
    } catch (error) {
        console.error("Error clearing contests:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearContests();
