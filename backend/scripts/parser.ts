import 'dotenv/config';
import fs from 'fs';

import { prisma } from './parser_components/prisma';

import { getData } from './parser_components/getData';
import { getHtmlFiles } from './parser_components/getHtmlFiles';

import { saveGame } from './parser_components/saveGame';
import { saveCompany } from './parser_components/saveCompany'
import { saveGenre } from './parser_components/saveGenre';

/* --------------------------------- */
/* ----------- MAIN ---------------- */
/* --------------------------------- */

async function main(): Promise<void> {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error(
      'Nie podano ścieżki wejściowej. Poprawne użycie: node ps1-datacenter-parser.js <ścieżka_do_pliku_lub_katalogu>',
    );

    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Nie znaleziono: ${inputPath}`);
    process.exit(1);
  }

  const files = getHtmlFiles(inputPath);

  let separator = false;

  for (const [index, filePath] of files.entries()) {

    /* Wczytanie pliku */
    const data = getData(filePath);

    /* Stylizacja */
    if(separator)
    {
      console.log("")
      console.log("----------------------------------------------------------")
      const current = String(index + 1).padStart(5, '0');
      const total = String(files.length).padStart(5, '0');
      console.log(`Plik [${current}/${total}] - ${filePath}`);
    }

    console.log(`${filePath}`);
    //console.log(data.regionsReleased);



    if(data.regionsReleased)
    {
      const ukRelease = data.regionsReleased?.pal?.find(
        (release) => release.flag === 'uk',
      );

      const usaRelease = data.regionsReleased?.ntscU?.find(
  (release) => release.flag === 'usa',
)

      console.log(`ukRelease: ${ukRelease?.name}`);
      console.log(`usaRelease: ${usaRelease?.name}`);
    }


    /* Dodanie developera & publishera do bazy */
    //await saveCompany(data);

    /* Dodanie gatunku do bazy */
    //await saveGenre(data);

    /* Dodanie gry do bazy */
    //await saveGame(data);



    /* Stylizacja */
    if(separator)
    {
      console.log("----------------------------------------------------------")
    }

  }

  console.log(`\nPrzetworzono: ${files.length} plików`);
}

/* --------------------------------- */
/* ----------- ERRORS--------------- */
/* --------------------------------- */

main()
  .catch((error) => {
    console.error('Błąd:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });