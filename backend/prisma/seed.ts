import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import { seedConsoles } from './seeds/consoles';
import { seedRegionCodes } from './seeds/regionCodes';
import { seedRegions } from './seeds/regions';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });



async function main() {
  console.log("🌱 Seeding database...");

  // Konsole, regiony i kody regionów
  await seedConsoles(prisma);
  await seedRegions(prisma);
  await seedRegionCodes(prisma);

  console.log("🌱 Seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });