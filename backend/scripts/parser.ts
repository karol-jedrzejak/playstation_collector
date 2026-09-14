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

  for (const filePath of files) {
    /* Wczytanie pliku */
    const data = getData(filePath);

    /* Dodanie developera & publishera do bazy */
    //await saveCompany(data);

    /* Dodanie gatunku do bazy */
    await saveGenre(data);




    //console.log(`${filePath}: ${JSON.stringify(data.info.genreStyle)}`,);



    /* Dodanie gry do bazy */
    //await saveGame(data);

    //console.log(`${filePath}: ${JSON.stringify(data.info.commonTitle)}`,);

    //console.log(JSON.stringify(data, null, 2));
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