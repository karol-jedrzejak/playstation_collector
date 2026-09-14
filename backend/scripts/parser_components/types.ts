export type RegionKey = 'ntscJ' | 'ntscU' | 'pal';

export interface Disc {
  discNumber: string | null;
  printedSerialNumber: string | null;
  serialNumberInDisc: string | null;
  mediaDiscID: string | null;
}

export interface Language {
  language: string;
  flag: string | null;
}

export interface DescriptionText {
  type: 'text';
  value: string;
}

export interface DescriptionList {
  type: 'list';
  value: string[];
}

export type DescriptionItem = DescriptionText | DescriptionList;

export interface ReleasedRegion {
  name: string;
  code: string | null;
  flag: string | null;
}

export interface CoverImage {
  name: string | null;
  link: string;
}

export interface Cover {
  type: string;
  flag: string | null;
  images: CoverImage[];
}

export interface GameInfo {
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
