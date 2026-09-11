import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

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

/* --------------------------------- */
/* ----------- TYPES --------------- */
/* --------------------------------- */

type RegionKey = 'ntscJ' | 'ntscU' | 'pal';

interface Disc {
  discNumber: string | null;
  printedSerialNumber: string | null;
  serialNumberInDisc: string | null;
  mediaDiscID: string | null;
}

interface Language {
  language: string;
  flag: string | null;
}

interface DescriptionText {
  type: 'text';
  value: string;
}

interface DescriptionList {
  type: 'list';
  value: string[];
}

type DescriptionItem = DescriptionText | DescriptionList;

interface ReleasedRegion {
  name: string;
  code: string | null;
  flag: string | null;
}

interface CoverImage {
  name: string | null;
  link: string;
}

interface Cover {
  type: string;
  flag: string | null;
  images: CoverImage[];
}

interface GameInfo {
  info: {
    officialTitle: string | null;
    commonTitle: string | null;
    serialNumber: string | null;
    region: string | null;
    genreStyle: string | null;
    developer: string | null;
    publisher: string | null;
    releaseDate: string | null;

    barcodeNumbers: {
      prevCellText: string;
      value: string | null;
      flag: string | null;
    };

    languages: Language[];
    languageText: string | null;

    description: DescriptionItem[];

    elspa: string | null;
    usk: string | null;

    screenshots: string[];
  };

  discs: Disc[];

  features: {
    numberOfPlayers: string | null;
    numberOfMemoryCardBlocks: string | null;
    compatibleControllersTested: string | null;
    compatibleLightGuns: string | null;
    otherCompatibleControllers: string | null;
    specialControllers: string | null;
    vibrationFunctionCompatible: string | null;
    multiTapFunctionCompatible: string | null;
    linkCableFunctionCompatible: string | null;
  };

  regionsReleased: {
    ntscJ: ReleasedRegion[];
    ntscU: ReleasedRegion[];
    pal: ReleasedRegion[];
  };

  coversLinks: Cover[];
}

/* --------------------------------- */
/* ----------- GET FILES ----------- */
/* --------------------------------- */

function getHtmlFiles(inputPath: string): string[] {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    return path.extname(inputPath).toLowerCase() === '.html'
      ? [inputPath]
      : [];
  }

  const files: string[] = [];

  for (const entry of fs.readdirSync(inputPath, { withFileTypes: true })) {
    const fullPath = path.join(inputPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === '.html'
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/* --------------------------------- */
/* ----------- Clean files --------- */
/* --------------------------------- */

function cleanHtml(buffer: Buffer): string {
  let html: string;

  // UTF-16 LE
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    html = buffer.toString('utf16le');
  }

  // UTF-16 BE
  else if (
    buffer.length >= 2 &&
    buffer[0] === 0xfe &&
    buffer[1] === 0xff
  ) {
    /*
     * Node nie posiada BufferEncoding "utf16be".
     * Zamieniamy kolejność bajtów i czytamy jako UTF-16 LE.
     */
    const converted = Buffer.alloc(buffer.length - 2);

    for (let i = 2; i + 1 < buffer.length; i += 2) {
      converted[i - 2] = buffer[i + 1];
      converted[i - 1] = buffer[i];
    }

    html = converted.toString('utf16le');
  }

  // Pozostałe pliki
  else {
    html = buffer.toString('latin1');
  }

  html = html
    .replace(/^\uFEFF/, '')
    .replace(/\u00a0/g, ' ');

  return html;
}

/* --------------------------------- */
/* ----------- GET Data ------------ */
/* --------------------------------- */

function getData(filePath: string): GameInfo {
  const buffer = fs.readFileSync(filePath);
  const html = cleanHtml(buffer);

  const $ = cheerio.load(html);

  const gameInfo: GameInfo = {
    info: {
      officialTitle: null,
      commonTitle: null,
      serialNumber: null,
      region: null,
      genreStyle: null,
      developer: null,
      publisher: null,
      releaseDate: null,

      barcodeNumbers: {
        prevCellText: 'Barcode Number(s)',
        value: null,
        flag: null,
      },

      languages: [],
      languageText: null,

      description: [],

      elspa: null,
      usk: null,

      screenshots: [],
    },

    discs: [],

    features: {
      numberOfPlayers: null,
      numberOfMemoryCardBlocks: null,
      compatibleControllersTested: null,
      compatibleLightGuns: null,
      otherCompatibleControllers: null,
      specialControllers: null,
      vibrationFunctionCompatible: null,
      multiTapFunctionCompatible: null,
      linkCableFunctionCompatible: null,
    },

    regionsReleased: {
      ntscJ: [],
      ntscU: [],
      pal: [],
    },

    coversLinks: [],
  };

  /* --------------------------------- */
  /* -----------INFO------------------ */
  /* --------------------------------- */

  const infoMap: Record<string, keyof GameInfo['info']> = {
    'Official Title': 'officialTitle',
    'Common Title': 'commonTitle',
    'Serial Number(s)': 'serialNumber',
    'Region': 'region',
    'Genre / Style': 'genreStyle',
    Developer: 'developer',
    Publisher: 'publisher',
    'Date Released': 'releaseDate',
  };

  $('#table4 td').each((_, cell) => {
    const text = $(cell)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    const fieldName = infoMap[text];

    if (
      fieldName &&
      fieldName !== 'barcodeNumbers' &&
      fieldName !== 'languages' &&
      fieldName !== 'languageText' &&
      fieldName !== 'description' &&
      fieldName !== 'elspa' &&
      fieldName !== 'usk' &&
      fieldName !== 'screenshots'
    ) {
      gameInfo.info[fieldName] = $(cell)
        .next('td')
        .text()
        .replace(/\s+/g, ' ')
        .trim() as never;
    }
  });

  /* --------------------------------- */
  /* -----------BARCODE NUMBERS------- */
  /* --------------------------------- */

  $('#table7 td').each((_, cell) => {
    const text = $(cell).text().trim();

    if (text.includes('Barcode Number(s)')) {
      const targetCell = $(cell).next('td');

      if (targetCell.text().includes('From the back cover.')) {
        const [start, end] = targetCell
          .text()
          .trim()
          .split('\n')
          .map((x) => x.trim());

        gameInfo.info.barcodeNumbers.value =
          end.replace(/\s*-\s*$/, '');

        const flagLink = targetCell.find('img').attr('src');

        gameInfo.info.barcodeNumbers.flag = flagLink
          ? flagLink
              .split('/')
              .pop()!
              .replace(/\.[^.]+$/, '')
          : null;
      }
    }
  });

  /* --------------------------------- */
  /* -----------DISCS----------------- */
  /* --------------------------------- */

  const discs: Disc[] = Array.from({ length: 6 }, () => ({
    discNumber: null,
    printedSerialNumber: null,
    serialNumberInDisc: null,
    mediaDiscID: null,
  }));

  $('#table7 td').each((_, cell) => {
    const text = $(cell).text().trim();

    if (
      text.includes('Disc Number') &&
      text.includes('Printed Serial Number')
    ) {
      let targetCell = $(cell).next('td');

      for (let i = 0; i < 6; i++) {
        const [start, end] = targetCell
          .text()
          .trim()
          .split('\n')
          .map((x) => x.trim());

        discs[i].discNumber = start || null;
        discs[i].printedSerialNumber = end || null;

        targetCell = targetCell.next('td');
      }
    }

    if (text.includes('Serial Number In Disc')) {
      let targetCell = $(cell).next('td');

      for (let i = 0; i < 6; i++) {
        discs[i].serialNumberInDisc =
          targetCell.text().trim() || null;

        targetCell = targetCell.next('td');
      }
    }

    if (text.includes('Media Disc ID')) {
      let targetCell = $(cell).next('td');

      for (let i = 0; i < 6; i++) {
        const value = targetCell.text().trim();

        if (value === 'N / A' || value === '') {
          discs[i].mediaDiscID = null;
        } else {
          discs[i].mediaDiscID = value;
        }

        targetCell = targetCell.next('td');
      }
    }
  });

  for (let i = 0; i < 6; i++) {
    if (discs[i].discNumber) {
      gameInfo.discs.push(discs[i]);
    }
  }

  /* --------------------------------- */
  /* -----------LANGUAGES------------- */
  /* --------------------------------- */

  $('#table13 td').each((_, cell) => {
    const $cell = $(cell);
    const img = $cell.find('img');

    if (img.length) {
      const language = $cell
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim();

      if (language) {
        gameInfo.info.languages.push({
          language,
          flag: img.attr('src')
            ? img
                .attr('src')!
                .split('/')
                .pop()!
                .replace(/\.[^.]+$/, '')
            : null,
        });
      }
    }
  });

  gameInfo.info.languageText =
    $('#table11 font').text().trim() || null;

  /* --------------------------------- */
  /* -----------DESCRIPTION ---------- */
  /* --------------------------------- */

  const description: DescriptionItem[] = [];

  const $content = $('#table16 > tbody > tr > td').first();

  let currentText = '';

  function cleanText(text: string): string {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function addText(): void {
    const text = cleanText(currentText);

    if (text) {
      description.push({
        type: 'text',
        value: text,
      });
    }

    currentText = '';
  }

  $content.contents().each((_, node) => {
    if (node.type === 'text') {
      currentText += $(node).text();
      return;
    }

    if (node.type === 'tag' && node.name === 'br') {
      addText();
      return;
    }

    if (node.type === 'tag' && node.name === 'ul') {
      addText();

      const list: string[] = [];

      $(node)
        .find('li')
        .each((_, li) => {
          const text = cleanText($(li).text());

          if (text) {
            list.push(text);
          }
        });

      if (list.length) {
        description.push({
          type: 'list',
          value: list,
        });
      }

      return;
    }

    if (node.type === 'tag') {
      currentText += $(node).text();
    }
  });

  addText();

  gameInfo.info.description = description;

  /* --------------------------------- */
  /* -----------ELSPA I USK ---------- */
  /* --------------------------------- */

  let elspa: string | null = null;
  let usk: string | null = null;

  $('#table4 img').each((_, img) => {
    const src = $(img).attr('src') || '';

    if (src.includes('/elspa/')) {
      elspa = src.match(/elspa-(\d+)\./)?.[1] ?? null;
    }

    if (src.includes('/usk/')) {
      usk = src.match(/usk-(\d+)\./)?.[1] ?? null;
    }
  });

  gameInfo.info.elspa = elspa;
  gameInfo.info.usk = usk;

  /* --------------------------------- */
  /* -----------FEATURES--- ---------- */
  /* --------------------------------- */

  const featuresMap: Record<
    string,
    keyof GameInfo['features']
  > = {
    'Number Of Players': 'numberOfPlayers',
    'Number Of Memory Card Blocks': 'numberOfMemoryCardBlocks',
    'Compatible Controllers Tested': 'compatibleControllersTested',
    'Compatible Light Guns': 'compatibleLightGuns',
    'Other Compatible Controllers': 'otherCompatibleControllers',
    'Special Controllers Included': 'specialControllers',
    'Vibration Function Compatible': 'vibrationFunctionCompatible',
    'Multi-Tap Function Compatible': 'multiTapFunctionCompatible',
    'Link Cable Function Compatibile': 'linkCableFunctionCompatible',
  };

  $('#table19 > tbody > tr').each((_, row) => {
    const cells = $(row).find('td');

    if (cells.length < 2) {
      return;
    }

    const key = $(cells.eq(0))
      .text()
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const value = $(cells.eq(1))
      .text()
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    for (const [searchText, field] of Object.entries(
      featuresMap,
    )) {
      if (key.includes(searchText)) {
        gameInfo.features[field] = value;
        break;
      }
    }
  });

  /* --------------------------------- */
  /* -----------SCREENSHOTS----------- */
  /* --------------------------------- */

  $('#table22 img').each((_, img) => {
    const src = $(img).attr('src');

    if (src) {
      gameInfo.info.screenshots.push(src);
    }
  });

  /* --------------------------------- */
  /* -----------OTHER REGIONS--------- */
  /* --------------------------------- */

  const regionMap: Record<string, RegionKey> = {
    'NTSC-J': 'ntscJ',
    'NTSC-U': 'ntscU',
    PAL: 'pal',
  };

  let currentRegion: RegionKey | null = null;

  $('#table32 > tbody > tr > td')
    .first()
    .children()
    .each((_, element) => {
      const $element = $(element);

      if ($element.is('font')) {
        const regionText = $element
          .text()
          .replace(/\s+/g, ' ')
          .replace(':', '')
          .trim();

        for (const [regionName, field] of Object.entries(
          regionMap,
        )) {
          if (regionText.includes(regionName)) {
            currentRegion = field;
            break;
          }
        }

        return;
      }

      if ($element.is('ul') && currentRegion) {
        $element.find('li').each((_, li) => {
          const $li = $(li);

          const text = $li
            .clone()
            .find('img')
            .remove()
            .end()
            .text()
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const codeMatch = text.match(/\[([^\]]+)\]/);

          const code = codeMatch
            ? codeMatch[1].trim()
            : null;

          const name = text
            .replace(/\s*\[[^\]]+\]\s*$/, '')
            .trim();

          const flagSrc = $li.find('img').attr('src') || '';

          const flag = flagSrc
            ? flagSrc
                .split('/')
                .pop()!
                .replace(/\.[^.]+$/, '')
            : null;

        if(currentRegion){
            gameInfo.regionsReleased[currentRegion].push({
                name,
                code,
                flag,
            });
            }
        });
      }
    });

  /* --------------------------------- */
  /* -----------COVERS---------------- */
  /* --------------------------------- */

  $('#table26 > tbody > tr > td.sectional > table').each(
    (_, table) => {
      const $table = $(table);

      const tableId = $table.attr('id');

      if (tableId !== 'table28' && tableId !== 'table29') {
        return;
      }

      const rows = $table.find('> tbody > tr');

      if (rows.length < 3) {
        return;
      }

      // HEADER

      const $header = rows.eq(0).find('td').first();

      const flagSrc = $header.find('img').attr('src') || '';

      const flag = flagSrc
        ? flagSrc
            .split('/')
            .pop()!
            .replace(/\.[^.]+$/, '')
        : null;

      const type = $header
        .clone()
        .find('img')
        .remove()
        .end()
        .text()
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^\s*-\s*/, '')
        .trim();

      // NAZWY

      const names: (string | null)[] = [];

      rows.eq(1)
        .find('td')
        .each((_, td) => {
          const name = $(td)
            .text()
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          names.push(name || null);
        });

      // OBRAZKI

      const images: CoverImage[] = [];

      rows.eq(2)
        .find('td')
        .each((index, td) => {
          const $td = $(td);
          const $img = $td.find('img').first();

          if (!$img.length) {
            return;
          }

          const src = $img.attr('src');

          if (!src) {
            return;
          }

          images.push({
            name: names[index] || null,
            link: src,
          });
        });

      if (images.length > 0) {
        gameInfo.coversLinks.push({
          type,
          flag,
          images,
        });
      }
    },
  );

  /* --------------------------------- */
  /* -----------RETURN---------------- */
  /* --------------------------------- */

  return gameInfo;
}

/* --------------------------------- */
/* ----------- DATABASE ------------ */
/* --------------------------------- */

async function saveToDatabase(data: GameInfo): Promise<void> {
  /*
   * Game
   *
   * Zapisujemy dane, które bezpośrednio odpowiadają
   * obecnemu modelowi Game.
   */

  const game = await prisma.game.create({
    data: {
      officialName: data.info.officialTitle ?? data.info.commonTitle ?? '',
      commonName: data.info.commonTitle,

      /*
       * Opis z parsera jest tablicą bloków.
       * Obecny model Game ma tylko description String?,
       * dlatego łączymy tekstowe elementy w jeden tekst.
       */
      description:
        data.info.description.length > 0
          ? data.info.description
              .map((item) => {
                if (item.type === 'text') {
                  return item.value;
                }

                return item.value
                  .map((value) => `- ${value}`)
                  .join('\n');
              })
              .join('\n\n')
          : null,

      console: {
        connect: {
          id: 'PS1',
        },
      },

      /*
       * GameStyle jest enumem:
       * WESTERN / JAPANESE / MIXED / OTHER.
       *
       * Parser zwraca tekst, więc tylko podstawowe
       * wartości są mapowane.
       */
      style:
        data.info.genreStyle?.toLowerCase().includes('japan')
          ? 'JAPANESE'
          : data.info.genreStyle?.toLowerCase().includes('western')
            ? 'WESTERN'
            : data.info.genreStyle
              ? 'MIXED'
              : undefined,

      releases: {
        create: {
          releaseDate: data.info.releaseDate
            ? new Date(data.info.releaseDate)
            : null,

          serialNumber: data.info.serialNumber,

          barcode: data.info.barcodeNumbers.value,

          mediaType: 'CD',

          mediaCount:
            data.discs.length > 0
              ? data.discs.length
              : 1,

          /*
           * Region z parsera:
           * NTSC-J -> JAPAN
           * NTSC-U -> NORTH_AMERICA
           * PAL -> EUROPE
           */

          region: data.info.region
            ? {
                connect: {
                  code:
                    data.info.region === 'NTSC-J'
                      ? 'JAPAN'
                      : data.info.region === 'NTSC-U'
                        ? 'NORTH_AMERICA'
                        : data.info.region === 'PAL'
                          ? 'EUROPE'
                          : undefined,
                },
              }
            : undefined,

          /*
           * RegionCode pobieramy z seriala.
           *
           * Przykład:
           * SLES-12345 -> SLES
           */
          regionCode: data.info.serialNumber
            ? {
                connect: {
                  consoleId_code: {
                    consoleId: 'PS1',
                    code: data.info.serialNumber
                      .split('-')[0]
                      .trim(),
                  },
                },
              }
            : undefined,

          supportsVibration:
            data.features.vibrationFunctionCompatible
              ? data.features.vibrationFunctionCompatible
                  .toLowerCase()
                  .includes('yes')
              : undefined,

          /*
           * Dane o płytach.
           */
          discs: {
            create: data.discs
              .filter((disc) => disc.discNumber !== null)
              .map((disc, index) => ({
                discNumber:
                  Number(disc.discNumber) || index + 1,

                label:
                  disc.printedSerialNumber,

                serialNumber:
                  disc.serialNumberInDisc,

                mediaType: 'CD' as const,
              })),
          },
        },
      },
    },
  });

  console.log(`Dodano do bazy: ${game.id}`);
}

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
    const data = getData(filePath);

    /*
     * DODANIE DO BAZY
     */
    await saveToDatabase(data);

    console.log(
      `${filePath}: ${JSON.stringify(data.info.commonTitle)}`,
    );

    console.log(JSON.stringify(data, null, 2));
  }

  console.log(`\nPrzetworzono: ${files.length} plików`);
}

main()
  .catch((error) => {
    console.error('Błąd:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });