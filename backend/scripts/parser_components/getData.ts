
import 'dotenv/config';
import fs from 'fs';
import * as cheerio from 'cheerio';

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

import { cleanHtml } from './cleanHtml';

/* --------------------------------- */
/* ----------- GET Data ------------ */
/* --------------------------------- */

export function getData(filePath: string): GameInfo {
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