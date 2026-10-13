import bcrypt from "bcrypt";
import { prisma } from '../../src/config/prisma.js';
import { logger } from "../../src/config/logger.js"


async function main() {
    const passwordHash = await bcrypt.hash("Smith@123", 12);

    const user = await prisma.user.upsert({
        where: { email: "smith@gmail.com"},
        update: {},
        create: {
            name: "Smith Nakhwa",
            email: "smith@gmail.com",
            passwordHash,
            role: "USER"
        }
    });

    const admin = await prisma.user.upsert({
        where: { email: "admin@gmail.com"},
        update: {},
        create: {
            name: "Admin Nakhwa",
            email: "admin@gmail.com",
            passwordHash,
            role: "ADMIN"
        }
    });

    for (const [owner, title, priority] of [
        [user, "learn Node.js", "MEDIUM"],
        [user, "Practise Express", "HIGH"],
        [admin, "Reviewing API security", "HIGH"]
    ]) {
        const existingTask = await prisma.task.findFirst({
            where: {
                userId: owner.id,
                title
            },
        });

        if (!existingTask) {
            await prisma.task.create({
                data: {
                    title,
                    description: "Seeded development Task",
                    status: "TODO",
                    priority,
                    userId: owner.id
                }
            })
        }
    }

    logger.info("Seed Completed");
    logger.info("Regular user: smith@gmail.com");
    logger.info("Admin user: admin@gmail.com");
    logger.info("Development password: Smith@123");
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
}).finally(async () => {
    await prisma.$disconnect();
})