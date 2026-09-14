export function cleanHtml(buffer: Buffer): string {
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
