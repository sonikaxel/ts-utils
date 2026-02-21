/**
 * Try to read File/Blob as DataURL in async.
 * FileReader interface is used to read the contents of the specified file's data as a base64 encoded string
 * @param file `File | Blob`
 * @returns file's data as a base64 encoded string or null
 */
export async function readFileAsDataURL(
  file: File | Blob,
): Promise<string | null> {
  const reader = new FileReader();

  const result = await new Promise<string | null>((resolve) => {
    reader.onloadend = () => {
      const _result = typeof reader.result === 'string' ? reader.result : null;
      resolve(_result);
    };

    reader.readAsDataURL(file);
  });

  return result;
}
