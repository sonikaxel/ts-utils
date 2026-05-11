type BaseAlphabets = 'A-Z' | 'a-z' | '0-9' | '-_';

function expandAlphabet(alphabet: BaseAlphabets) {
  switch (alphabet) {
    case 'a-z':
      return 'abcdefghijklmnopqrstuvwxyz';
    case 'A-Z':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case '0-9':
      return '0123456789';
    case '-_':
      return '-_';
    default:
      throw new Error(`Unsupported alphabet: ${alphabet}`);
  }
}

function createRandomStringGenerator(...baseAlphabets: BaseAlphabets[]) {
  const baseCharSet = baseAlphabets.map(expandAlphabet).join('');
  if (baseCharSet.length === 0) {
    throw new Error(
      'No valid characters provided for random string generation.',
    );
  }

  const baseCharSetLength = baseCharSet.length;

  return (length: number, ...alphabets: BaseAlphabets[]) => {
    if (length <= 0) {
      throw new Error('Length must be a positive integer.');
    }

    let charSet = baseCharSet;
    let charSetLength = baseCharSetLength;

    if (alphabets.length > 0) {
      charSet = alphabets.map(expandAlphabet).join('');
      charSetLength = charSet.length;
    }

    const maxValid = Math.floor(256 / charSetLength) * charSetLength;
    const buf = new Uint8Array(length * 2);
    const bufLength = buf.length;

    let result = '';
    let bufIndex = bufLength;
    let rand;

    while (result.length < length) {
      if (bufIndex >= bufLength) {
        crypto.getRandomValues(buf);
        bufIndex = 0;
      }

      rand = buf[bufIndex++];

      if (rand && rand < maxValid) {
        result += charSet[rand % charSetLength];
      }
    }

    return result;
  };
}

const generateId = (size: number) => {
  return createRandomStringGenerator('a-z', 'A-Z', '0-9')(size || 32);
};

export { createRandomStringGenerator, generateId };
