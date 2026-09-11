import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

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

const consoles = [
  { id: "PS1", name: "PlayStation" },
  { id: "PS2", name: "PlayStation 2" },
  { id: "PS3", name: "PlayStation 3" },
  { id: "PS4", name: "PlayStation 4" },
  { id: "PS5", name: "PlayStation 5" },
  { id: "PSP", name: "PlayStation Portable" },
  { id: "PSVITA", name: "PlayStation Vita" },
];

const regions = [
  ["JAPAN", "Japan"],
  ["NORTH_AMERICA", "North America"],
  ["LATIN_AMERICA", "Latin America"],
  ["EUROPE", "Europe"],
  ["UNITED_KINGDOM", "United Kingdom"],
  ["AUSTRALIA", "Australia"],
  ["NEW_ZEALAND", "New Zealand"],
  ["SOUTH_KOREA", "South Korea"],
  ["CHINA", "China"],
  ["HONG_KONG", "Hong Kong"],
  ["TAIWAN", "Taiwan"],
  ["SOUTHEAST_ASIA", "Southeast Asia"],
  ["ASIA", "Asia"],
  ["RUSSIA", "Russia"],
  ["MIDDLE_EAST", "Middle East"],
  ["AFRICA", "Africa"],
];

type RegionCodeSeed = {
  consoleId: string;
  code: string;
  regions: string[];
};

const regionCodes: RegionCodeSeed[] = [
  // PS1
  { consoleId: "PS1", code: "SLPS", regions: ["JAPAN"] },
  { consoleId: "PS1", code: "SLPM", regions: ["JAPAN"] },
  { consoleId: "PS1", code: "SCPS", regions: ["JAPAN"] },
  { consoleId: "PS1", code: "SLUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS1", code: "SCUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS1", code: "SLES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS1", code: "SCES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS1", code: "SLKA", regions: ["SOUTH_KOREA"] },

  // PS2
  { consoleId: "PS2", code: "SLPS", regions: ["JAPAN"] },
  { consoleId: "PS2", code: "SLPM", regions: ["JAPAN"] },
  { consoleId: "PS2", code: "SCPS", regions: ["JAPAN"] },
  { consoleId: "PS2", code: "SCAJ", regions: ["JAPAN", "ASIA"] },
  { consoleId: "PS2", code: "SLUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS2", code: "SCUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS2", code: "SLES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS2", code: "SCES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS2", code: "SLKA", regions: ["SOUTH_KOREA"] },
  { consoleId: "PS2", code: "SCKA", regions: ["SOUTH_KOREA"] },
  { consoleId: "PS2", code: "SCCS", regions: ["CHINA"] },
  { consoleId: "PS2", code: "SCPM", regions: ["ASIA"] },
  { consoleId: "PS2", code: "SCPN", regions: ["ASIA"] },
  { consoleId: "PS2", code: "TCPS", regions: ["ASIA"] },
  { consoleId: "PS2", code: "TCES", regions: ["ASIA"] },
  { consoleId: "PS2", code: "TLES", regions: ["EUROPE"] },

  // PS3
  { consoleId: "PS3", code: "BLJM", regions: ["JAPAN"] },
  { consoleId: "PS3", code: "BCJS", regions: ["JAPAN"] },
  { consoleId: "PS3", code: "BLJS", regions: ["JAPAN"] },
  { consoleId: "PS3", code: "BLUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS3", code: "BCUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PS3", code: "BLES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS3", code: "BCES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PS3", code: "BLAS", regions: ["ASIA"] },
  { consoleId: "PS3", code: "BCAS", regions: ["ASIA"] },
  { consoleId: "PS3", code: "BCKS", regions: ["SOUTH_KOREA"] },
  { consoleId: "PS3", code: "BLKS", regions: ["SOUTH_KOREA"] },

  // PS4
  {
    consoleId: "PS4",
    code: "CUSA",
    regions: [
      "NORTH_AMERICA",
      "LATIN_AMERICA",
      "EUROPE",
      "AUSTRALIA",
      "NEW_ZEALAND",
    ],
  },
  { consoleId: "PS4", code: "PCJS", regions: ["JAPAN"] },
  { consoleId: "PS4", code: "PLJM", regions: ["JAPAN"] },
  { consoleId: "PS4", code: "PLJS", regions: ["JAPAN"] },
  { consoleId: "PS4", code: "PCKS", regions: ["SOUTH_KOREA"] },
  { consoleId: "PS4", code: "PLKS", regions: ["SOUTH_KOREA"] },
  { consoleId: "PS4", code: "PCAS", regions: ["ASIA"] },
  { consoleId: "PS4", code: "PLAS", regions: ["ASIA"] },

  // PS5
  {
    consoleId: "PS5",
    code: "PPSA",
    regions: [
      "NORTH_AMERICA",
      "LATIN_AMERICA",
      "EUROPE",
      "AUSTRALIA",
      "NEW_ZEALAND",
    ],
  },
  { consoleId: "PS5", code: "ELJM", regions: ["JAPAN"] },
  { consoleId: "PS5", code: "ECAS", regions: ["ASIA"] },
  { consoleId: "PS5", code: "ELAS", regions: ["ASIA"] },

  // PSP
  { consoleId: "PSP", code: "ULJM", regions: ["JAPAN"] },
  { consoleId: "PSP", code: "ULUS", regions: ["NORTH_AMERICA"] },
  { consoleId: "PSP", code: "ULES", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PSP", code: "ULAS", regions: ["ASIA"] },
  { consoleId: "PSP", code: "ULKS", regions: ["SOUTH_KOREA"] },

  // PS Vita
  { consoleId: "PSVITA", code: "PCSA", regions: ["NORTH_AMERICA"] },
  { consoleId: "PSVITA", code: "PCSE", regions: ["NORTH_AMERICA"] },
  { consoleId: "PSVITA", code: "PCSF", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PSVITA", code: "PCSB", regions: ["EUROPE", "AUSTRALIA"] },
  { consoleId: "PSVITA", code: "PCSC", regions: ["JAPAN"] },
  { consoleId: "PSVITA", code: "PCSG", regions: ["JAPAN"] },
  { consoleId: "PSVITA", code: "PCSH", regions: ["ASIA"] },
  { consoleId: "PSVITA", code: "PCSD", regions: ["ASIA"] },
  { consoleId: "PSVITA", code: "VCAS", regions: ["ASIA"] },
];

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------------------------------
  // Consoles
  // ----------------------------------------

  for (const consoleData of consoles) {
    await prisma.console.upsert({
      where: {
        id: consoleData.id,
      },
      update: {
        name: consoleData.name,
        description: null,
      },
      create: {
        id: consoleData.id,
        name: consoleData.name,
        description: null,
      },
    });
  }

  console.log("✓ Consoles");

  // ----------------------------------------
  // Regions
  // ----------------------------------------

  for (const [code, name] of regions) {
    await prisma.region.upsert({
      where: {
        code,
      },
      update: {
        name,
      },
      create: {
        code,
        name,
      },
    });
  }

  console.log("✓ Regions");

  // ----------------------------------------
  // Region codes
  // ----------------------------------------

  for (const item of regionCodes) {
    await prisma.regionCode.upsert({
      where: {
        consoleId_code: {
          consoleId: item.consoleId,
          code: item.code,
        },
      },

      update: {
        regions: {
          set: item.regions.map((regionCode) => ({
            code: regionCode,
          })),
        },
      },

      create: {
        consoleId: item.consoleId,
        code: item.code,

        regions: {
          connect: item.regions.map((regionCode) => ({
            code: regionCode,
          })),
        },
      },
    });
  }

  console.log("✓ Region codes");

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