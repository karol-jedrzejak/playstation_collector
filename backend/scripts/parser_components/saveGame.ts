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

import { RegionalStandard } from '../../generated/prisma/client';

import { normalizeCompanyName } from "./saveCompany";

export async function saveGame(data: GameInfo): Promise<void> {

    let developers = data.info.developer?.split("/").map(normalizeCompanyName).filter(Boolean);
    let publishers = data.info.publisher?.split("/").map(normalizeCompanyName).filter(Boolean);
    let genres = data.info.genreStyle?.split("/").map((genre) => genre.trim()).filter(Boolean);

    function parseRegionalStandard( value?: string | null, ): RegionalStandard | undefined { if (!value) return undefined; return Object.values(RegionalStandard).includes( value as RegionalStandard, ) ? (value as RegionalStandard) : undefined; }

    const ukRelease = data.regionsReleased?.pal?.find(
      (release) => release.flag === 'uk',
    );
    const usaRelease = data.regionsReleased?.ntscU?.find(
      (release) => release.flag === 'usa',
    );

    if (data.info.commonTitle && data.info.officialTitle)
    {
      const existingGame = await prisma.game.findFirst({
        where: {
          OR: [
            { officialName: data.info.commonTitle },
            { officialName: data.info.officialTitle },
            { officialName: ukRelease?.name },
            { officialName: usaRelease?.name },
            { commonName: data.info.commonTitle },
            { commonName: data.info.officialTitle },
            { commonName: ukRelease?.name },
            { commonName: usaRelease?.name },
          ],
        },
        include: {
          releases: true,
        },
      });

      if(existingGame)
      {
        // add relese to existing game
      } else{
        
        if("uk" == "uk") //if uk or usa relese avabile
        {
          // add uk or usa game
          // add as relese

        } else{
          // if no uka usa game

          // add game with release


        };

      };

    }

    

    const game = await prisma.game.create({
    data: {
      officialName: data.info.officialTitle ?? data.info.commonTitle ?? '',
      commonName: data.info.commonTitle,


      developers: {
        create: developers?.map((name) => ({
          company: {
            connect: {
              name,
            },
          },
        })),
      },


      publishers: {
        create: publishers?.map((name) => ({
          company: {
            connect: {
              name,
            },
          },
        })),
      },

      
      genres: {
        create: genres?.map((name) => ({
          genre: {
            connect: {
              name,
            },
          },
        })),
      },

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


          regionalStandard: parseRegionalStandard(data.info.region),


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

  /*
   * Game
   *
   * Zapisujemy dane, które bezpośrednio odpowiadają
   * obecnemu modelowi Game.
   */
  console.log(`Dodano do bazy: ${game.commonName}`);
 
}


  
