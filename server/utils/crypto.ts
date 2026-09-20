import crypto from 'crypto';

/**
 * Generate Crypographics random string.
 * @param length size of Id, default `32`
 * @description requires `nodejs` environment, cannot be run on browser
 * */
export const generateCryptoId = (length: number = 32) => {
  if (!Number.isInteger(length)) {
    length = Math.ceil(length);
  }

  let arr = new Uint8Array(length / 2);
  return Buffer.from(crypto.getRandomValues(arr)).toString('hex');
};
