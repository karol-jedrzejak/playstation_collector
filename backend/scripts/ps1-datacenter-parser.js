const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/* --------------------------------- */
/* ----------- GET FILES ----------- */
/* --------------------------------- */

function getHtmlFiles(inputPath) {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    return path.extname(inputPath).toLowerCase() === '.html'
      ? [inputPath]
      : [];
  }

  const files = [];

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
/* ----------- Clean files ----------- */
/* --------------------------------- */

function cleanHtml(buffer) {
  let html;

    // 2. Wykrywamy kodowanie na podstawie pierwszych bajtów pliku (BOM)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      // Plik jest w UTF-16 LE (stąd brały się znaki ÿþ)
      html = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      // Plik jest w UTF-16 BE
      html = buffer.toString('utf16be');
    } else {
      // Domyślne odczytanie dla pozostałych plików (UTF-8 / Latin1)
      html = buffer.toString('latin1');
    }

    // 3. Czyszczenie: usuwamy niewidoczne znaki BOM oraz twarde spacje (\u00a0)
    html = html
      .replace(/^\uFEFF/, '')   // Usuwa niewidoczny znak BOM z początku ciągu
      .replace(/\u00a0/g, ' '); // Zamienia &nbsp; na zwykłą spację

    return html;
  }



/* --------------------------------- */
/* ----------- GET Data ----------- */
/* --------------------------------- */

function getData(filePath) {

  let buffer = fs.readFileSync(filePath);
  let html = cleanHtml(buffer);
  const $ = cheerio.load(html);

let gameInfo = {
  info: {
    officialTitle: null,
    commonTitle: null,
    serialNumber: null,
    region: null,
    genreStyle: null,
    developer: null,
    publisher: null,
    releaseDate: null,
  },
  discs: [],
  features:{
    numberOfPlayers: null,
    numberOfMemoryCardBlocks: null,
    compatibleControllersTested: null,
    compatibleLightGuns: null,
    otherCompatibleControllers: null,
    specialControllers: null,
    vibrationFunctionCompatible: null,
    multiTapFunctionCompatible: null,
    linkCableFunctionCompatible: null
  },
  regionsReleased: {
    ntscJ: [],
    ntscU: [],
    pal: []
  }
};

  /* --------------------------------- */
  /* -----------INFO------------------ */
  /* --------------------------------- */

  const infoMap = {
    'Official Title': 'officialTitle',
    'Common Title': 'commonTitle',
    'Serial Number(s)': 'serialNumber',
    'Region': 'region',
    'Genre / Style': 'genreStyle',
    'Developer': 'developer',
    'Publisher': 'publisher',
    'Date Released': 'releaseDate',
  };

  $('#table4 td').each((_, cell) => {
    const text = $(cell)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    const fieldName = infoMap[text];

    if (fieldName) {
      gameInfo.info[fieldName] = $(cell)
        .next('td')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
    }
  });

  /* --------------------------------- */
  /* -----------BARCODE NUMBERS------- */
  /* --------------------------------- */

  gameInfo.info.barcodeNumbers = {
    prevCellText: 'Barcode Number(s)',
    value: null,
    flag: null,
  };

  $('#table7 td').each((_, cell) => {
    const text = $(cell).text().trim();

    if (text.includes('Barcode Number(s)')) {
      const targetCell = $(cell).next('td');

      if(targetCell.text().includes("From the back cover.")) {
        const [start, end] = targetCell.text().trim().split('\n').map(x => x.trim());
        // Barcode — usuwa spacje i "-" znajdujące się na końcu
        gameInfo.info.barcodeNumbers.value =
          end.replace(/\s*-\s*$/, '');

        // Flaga
        const flagLink = targetCell.find('img').attr('src');

        gameInfo.info.barcodeNumbers.flag = flagLink
          ? flagLink.split('/').pop().replace(/\.[^.]+$/, '')
          : null;
      }
    }
  });


  /* --------------------------------- */
  /* -----------DISCS----------------- */
  /* --------------------------------- */

  const discs = Array.from({ length: 6 }, () => ({
    discNumber: null,
    printedSerialNumber: null,
    serialNumberInDisc: null,
    mediaDiscID: null,
  }));

  
  $('#table7 td').each((_, cell) => {
    const text = $(cell).text().trim();
   
    if (text.includes("Disc Number") && text.includes("Printed Serial Number")) {
      let targetCell = $(cell).next('td');


      for (let i = 0; i < 6; i++) {

        const [start, end] = targetCell.text().trim().split('\n').map(x => x.trim());
        discs[i].discNumber = start;
        discs[i].printedSerialNumber = end;
        targetCell = targetCell.next('td');
      }
    }

    if (text.includes("Serial Number In Disc")) {
      let targetCell = $(cell).next('td');

      for (let i = 0; i < 6; i++) {
        discs[i].serialNumberInDisc = targetCell.text().trim();
        targetCell = targetCell.next('td');
      }
    }

    if (text.includes("Media Disc ID")) {
      let targetCell = $(cell).next('td');

      for (let i = 0; i < 6; i++) {
        if(targetCell.text().trim() === "N / A" || targetCell.text().trim() === "") {
          discs[i].mediaDiscID = null;
        } else {
          discs[i].mediaDiscID = targetCell.text().trim();
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

  gameInfo.info.languages = [];
  gameInfo.info.languageText = null;

  $('#table13 td').each((_, cell) => {
    const $cell = $(cell);
    const img = $cell.find('img');

    if (img.length) {
      const language = $cell.clone().children().remove().end().text().trim();

      if (language) {
        gameInfo.info.languages.push({
          language: language,
          flag: img.attr('src')
            ? img.attr('src').split('/').pop().replace(/\.[^.]+$/, '')
            : null
        });
      }
    }
  });

  // Tekst "Menus and gameplay..."
  gameInfo.info.languageText =
    $('#table11 font').text().trim() || null;


  /* --------------------------------- */
  /* -----------DESCRIPTION ---------- */
  /* --------------------------------- */

  const description = [];

  const $content = $('#table16 > tbody > tr > td').first();

  let currentText = '';

  function cleanText(text) {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function addText() {
    const text = cleanText(currentText);

    if (text) {
      description.push({
        type: 'text',
        value: text
      });
    }

    currentText = '';
  }

  $content.contents().each((_, node) => {

    // Zwykły tekst
    if (node.type === 'text') {
      currentText += $(node).text();
      return;
    }

    // <br>
    if (node.type === 'tag' && node.name === 'br') {
      addText();
      return;
    }

    // <ul>
    if (node.type === 'tag' && node.name === 'ul') {
      addText();

      const list = [];

      $(node).find('li').each((_, li) => {
        const text = cleanText($(li).text());

        if (text) {
          list.push(text);
        }
      });

      if (list.length) {
        description.push({
          type: 'list',
          value: list
        });
      }

      return;
    }

    // Inne elementy, np. <u>
    if (node.type === 'tag') {
      currentText += $(node).text();
    }
  });

  // Tekst, który został na samym końcu
  addText();

  gameInfo.info.description = description;

  /* --------------------------------- */
  /* -----------ELSPA I USK ---------- */
  /* --------------------------------- */

  let elspa = null;
  let usk = null;

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

  const featuresMap = {
    'Number Of Players': 'numberOfPlayers',
    'Number Of Memory Card Blocks': 'numberOfMemoryCardBlocks',
    'Compatible Controllers Tested': 'compatibleControllersTested',
    'Compatible Light Guns': 'compatibleLightGuns',
    'Other Compatible Controllers': 'otherCompatibleControllers',
    'Special Controllers Included': 'specialControllers',
    'Vibration Function Compatible': 'vibrationFunctionCompatible',
    'Multi-Tap Function Compatible': 'multiTapFunctionCompatible',
    'Link Cable Function Compatibile': 'linkCableFunctionCompatible'
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

    for (const [searchText, field] of Object.entries(featuresMap)) {
      if (key.includes(searchText)) {
        gameInfo.features[field] = value;
        break;
      }
    }
  });

  /* --------------------------------- */
  /* -----------SCREENSHOTS----------- */
  /* --------------------------------- */

  gameInfo.info.screenshots = [];

  $('#table22 img').each((_, img) => {
    const src = $(img).attr('src');

    if (src) {
      gameInfo.info.screenshots.push(src);
    }
  });

  /* --------------------------------- */
  /* -----------OTHER REGIONS--------- */
  /* --------------------------------- */

  const regionMap = {
    'NTSC-J': 'ntscJ',
    'NTSC-U': 'ntscU',
    'PAL': 'pal'
  };

  let currentRegion = null;

  $('#table32 > tbody > tr > td').first().children().each((_, element) => {
    const $element = $(element);

    // Szukamy nagłówka regionu, np. NTSC-J:
    if ($element.is('font')) {
      const regionText = $element.text()
        .replace(/\s+/g, ' ')
        .replace(':', '')
        .trim();

      for (const [regionName, field] of Object.entries(regionMap)) {
        if (regionText.includes(regionName)) {
          currentRegion = field;
          break;
        }
      }

      return;
    }

    // Lista gier dla aktualnego regionu
    if ($element.is('ul') && currentRegion) {
      $element.find('li').each((_, li) => {
        const $li = $(li);

        // Tekst bez img
        const text = $li.clone()
          .find('img')
          .remove()
          .end()
          .text()
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Kod w [SCPS-45350]
        const codeMatch = text.match(/\[([^\]]+)\]/);

        const code = codeMatch
          ? codeMatch[1].trim()
          : null;

        // Nazwa bez [SCPS-45350]
        const name = text
          .replace(/\s*\[[^\]]+\]\s*$/, '')
          .trim();

        // Flaga
        const flagSrc = $li.find('img').attr('src') || '';

        const flag = flagSrc
          ? flagSrc.split('/').pop().replace(/\.[^.]+$/, '')
          : null;

        gameInfo.regionsReleased[currentRegion].push({
          name,
          code,
          flag
        });
      });
    }
  });

  /* --------------------------------- */
  /* -----------COVERS---------------- */
  /* --------------------------------- */

  gameInfo.coversLinks = [];

  $('#table26 > tbody > tr > td.sectional > table').each((_, table) => {
    const $table = $(table);

    // Interesują nas tylko tabele z coverami
    const tableId = $table.attr('id');

    if (tableId !== 'table28' && tableId !== 'table29') {
      return;
    }

    const rows = $table.find('> tbody > tr');

    if (rows.length < 3) {
      return;
    }

    // -----------------------------------
    // HEADER: flaga + typ
    // -----------------------------------
    const $header = rows.eq(0).find('td').first();

    const flagSrc = $header.find('img').attr('src') || '';

    const flag = flagSrc
      ? flagSrc.split('/').pop().replace(/\.[^.]+$/, '')
      : null;

    const type = $header.clone()
      .find('img')
      .remove()
      .end()
      .text()
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s*-\s*/, '')
      .trim();

    // -----------------------------------
    // NAZWY - drugi wiersz
    // -----------------------------------
    const names = [];

    rows.eq(1).find('td').each((_, td) => {
      const name = $(td)
        .text()
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      names.push(name || null);
    });

    // -----------------------------------
    // OBRAZKI - trzeci wiersz
    // -----------------------------------
    const images = [];

    rows.eq(2).find('td').each((index, td) => {
      const $td = $(td);
      const $img = $td.find('img').first();

      // Brak obrazka = pusta komórka
      if (!$img.length) {
        return;
      }

      const src = $img.attr('src');

      if (!src) {
        return;
      }

      images.push({
        name: names[index] || null,
        link: src
      });
    });

    // -----------------------------------
    // DODAJEMY KAŻDĄ TABELĘ OSOBNO
    // -----------------------------------
    if (images.length > 0) {
      gameInfo.coversLinks.push({
        type,
        flag,
        images
      });
    }
  });

  /* --------------------------------- */
  /* -----------RETURN---------------- */
  /* --------------------------------- */


  return gameInfo;
}


/* --------------------------------- */
/* ----------- Other --------------- */
/* --------------------------------- */


const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Nie podano ścieżki wejściowej. Poprawne użycie: node ps1-datacenter-parser.js <ścieżka_do_pliku_lub_katalogu>');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Nie znaleziono: ${inputPath}`);
  process.exit(1);
}

const files = getHtmlFiles(inputPath);

for (const filePath of files) {
  const data = getData(filePath);
  console.log(`${filePath}: ${JSON.stringify(data.info.commonTitle)}`);
  console.log(JSON.stringify(data, null, 2));
}

console.log(`\nPrzetworzono: ${files.length} plików`);