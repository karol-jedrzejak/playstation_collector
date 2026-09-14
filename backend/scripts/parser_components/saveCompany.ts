import { prisma } from './prisma';

import type {
  GameInfo,
  Cover,
  CoverImage,
  DescriptionItem,
  DescriptionList,
  DescriptionText,
  Language,
  Disc,
  RegionKey
} from './types';

export function normalizeCompanyName(name: string): string {
  let result = name.trim();

  // Usuń kropkę końcową, jeśli nie jest częścią typowego skrótu
  const abbreviations = [
    "Inc.",
    "Ltd.",
    "Corp.",
    "Co.",
    "St.",
    "S.A.",
    "A/S",
    "B.V.",
    "N.V.",
    "Pty.",
    "LLC.",
  ];

  const endsWithAbbreviation = abbreviations.some((abbr) =>
    result.toLowerCase().endsWith(abbr.toLowerCase()),
  );

  if (!endsWithAbbreviation) {
    result = result.replace(/\.$/, "");
  }

  return result.trim();
}


export async function saveCompany(data: GameInfo): Promise<void> {

  let current_companies = await prisma.company.findMany();

  let developers = data.info.developer?.split("/").map(normalizeCompanyName).filter(Boolean);
  let publishers = data.info.publisher?.split("/").map(normalizeCompanyName).filter(Boolean);

  let companies_to_check = [...(developers ?? []) , ...(publishers ?? [])];

  const uniqueCompanyNames = [
    ...new Map(
      companies_to_check.map((name) => [
        normalizeCompanyName(name).toLowerCase(),
        normalizeCompanyName(name),
      ]),
    ).values(),
  ];

  const existingCompanyNames = new Set(
    current_companies.map((company) =>
      normalizeCompanyName(company.name).toLowerCase(),
    ),
  );

  const newCompanies = uniqueCompanyNames.filter(
    (name) =>
      !existingCompanyNames.has(
        normalizeCompanyName(name).toLowerCase(),
      ),
  );

  if (newCompanies.length > 0) {
    await prisma.company.createMany({
      data: newCompanies.map((name) => ({
        name,
      })),
      skipDuplicates: true,
    });

    newCompanies.forEach((name) => {
      console.log(`Dodaję nową firmę: ${name}`);
    });
  }
 
}



  
