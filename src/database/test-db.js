import { prisma } from "../config/prisma.js";


async function main() {
    await prisma.$connect();

    logger.info("Connected to PostgreSQL");

    const users = await prisma.user.findMany();
    const tasks = await prisma.task.findMany();

    logger.info("Users:", users);
    logger.info("Tasks:", tasks);

}

main()
.catch(console.error)
.finally(async () => {
    await prisma.$disconnect();
})