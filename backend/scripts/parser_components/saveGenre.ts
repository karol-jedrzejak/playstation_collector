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

export async function saveGenre(data: GameInfo): Promise<void> {

  let current_genres = await prisma.genre.findMany();

  let genres = data.info.genreStyle?.split("/").map((genre) => genre.trim()).filter(Boolean);

  if (!genres || genres.length === 0) {
    return;
  }

  // Usunięcie duplikatów z danych wejściowych
  const uniqueGenres = [...new Set(genres)];

  // Lista istniejących gatunków
  const existingGenreNames = new Set(
    current_genres.map((genre) => genre.name),
  );

  // Tylko gatunki, których nie ma jeszcze w bazie
  const newGenres = uniqueGenres.filter(
    (genre) => !existingGenreNames.has(genre),
  );

  if (newGenres.length > 0) {
    await prisma.genre.createMany({
      data: newGenres.map((name) => ({
        name,
      })),
      skipDuplicates: true,
    });

    newGenres.forEach((name) => {
      console.log(`Dodaję nowy gatunek: ${name}`);
    });
  }
 
}



  
