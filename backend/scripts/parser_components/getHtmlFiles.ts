import 'dotenv/config';
import fs from 'fs';
import path from 'path';

export function getHtmlFiles(inputPath: string): string[] {
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