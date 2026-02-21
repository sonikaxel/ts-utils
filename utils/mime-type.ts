const jpgRegExp = RegExp(/^ffd8ffe(0|1|2|3|8)/g);
const pngRegExp = RegExp(/^89504e47/g);
const gifRegExp = RegExp(/^47494638/g);
const webpRegExp = RegExp(/^52494646\w{8}57454250/g);

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

/**
 * Attempt to get mime-type from a File/Blob/ArrayBuffer.
 * @param file `File | Blob | ArrayBuffer`
 * @returns matched mime-type or null
 *
 * @description Supported image format `image/jpeg` | `image/png` | `image/gif` | `image/webp`
 */
export async function getImageMimeType(
  file: File | Blob | ArrayBuffer,
): Promise<ImageMimeType | null> {
  const fileBuffer =
    file instanceof ArrayBuffer ? file : await file.arrayBuffer();

  const byteArray = new Uint8Array(fileBuffer, 0, 16);
  const header = byteArray.reduce((acc, v) => {
    let hex = v.toString(16);
    hex = hex === '0' ? '00' : hex;
    return acc + hex;
  }, '');

  let mimeType: ImageMimeType | null = null;

  if (header.match(jpgRegExp)?.length) {
    mimeType = 'image/jpeg';
  } else if (header.match(pngRegExp)?.length) {
    mimeType = 'image/png';
  } else if (header.match(gifRegExp)?.length) {
    mimeType = 'image/gif';
  } else if (header.match(webpRegExp)?.length) {
    mimeType = 'image/webp';
  }

  return mimeType;
}
