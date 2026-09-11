import { PrismaClient } from '../../generated/prisma/client';

export async function seedRegions(prisma: PrismaClient) {
    console.log('🌍 Seeding Regions...');

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
}