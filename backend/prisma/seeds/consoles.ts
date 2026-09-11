import { PrismaClient } from '../../generated/prisma/client';

export async function seedConsoles(prisma: PrismaClient) {
  console.log('🎮 Seeding consoles...');

  const consoles = [
    {
      id: 'PS1',
      name: 'PlayStation',
    },
    {
      id: 'PS2',
      name: 'PlayStation 2',
    },
    {
      id: 'PS3',
      name: 'PlayStation 3',
    },
    {
      id: 'PS4',
      name: 'PlayStation 4',
    },
    {
      id: 'PS5',
      name: 'PlayStation 5',
    },
    {
      id: 'PSP',
      name: 'PlayStation Portable',
    },
    {
      id: 'PSVITA',
      name: 'PlayStation Vita',
    },
  ];

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
}