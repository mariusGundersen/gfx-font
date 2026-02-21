import { GfxFont, createGfxFont } from './GfxFont';

export interface ParsedGlyph {
  offset: number;
  width: number;
  height: number;
  xAdvance: number;
  xOffset: number;
  yOffset: number;
}

export interface ParsedFont {
  name: string;
  first: number;
  last: number;
  yAdvance: number;
  glyphs: ParsedGlyph[];
  bitmaps: number[];
}

function tokenizeCCode(cCode: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inCommentArea = false;
  let inComment = false;

  for (let i = 0; i < cCode.length; i++) {
    const char = cCode[i];
    const nextChar = cCode[i + 1];

    if (inCommentArea) {
      if (char === '*' && nextChar === '/') {
        inCommentArea = false;
        i++;
      }
      continue;
    }

    if (inComment) {
      if (char === '\n') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inComment = true;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inCommentArea = true;
      i++;
      continue;
    }

    const separatingCharacters = '{}()[],;'.split('');
    if (/\s/.test(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else if (separatingCharacters.includes(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

function parseFont(cCode: string): ParsedFont {
  const tokens = tokenizeCCode(cCode);

  let i = 0;
  const getNextToken = (): string => {
    let token = tokens[i];
    i++;

    if (token === undefined) {
      throw new Error('Unexpected end of tokens, ' + tokens.slice(i - 5, i).join(' '));
    }
    return token;
  };

  const expectToken = (...expected: string[]): string => {
    try {
      const token = getNextToken();
      if (!expected.includes(token)) {
        throw new Error(`Expected token "${expected}", got "${token}" after "${tokens.slice(i - 5, i).join(' ')}"`);
      }
      return token;
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : error}, expected one of "${expected.join('", "')}"`);
    }
  };

  const expectNumber = (token = getNextToken()): number => {
    const number = parseInt(token);
    if (isNaN(number)) {
      throw new Error(`Expected number, got "${token}", after "${tokens.slice(i - 5, i).join(' ')}"`);
    }
    return number;
  };

  let name = '';
  const bitmaps: number[] = [];
  const glyphs: ParsedGlyph[] = [];
  let first = 0;
  let last = 0;
  let yAdvance = 0;

  let token = getNextToken();
  while (i < tokens.length) {
    if (token.endsWith('Bitmaps')) {
      expectToken('[');
      expectToken(']');
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (token !== '}') {
        if (token.startsWith('0x')) {
          bitmaps.push(parseInt(token, 16));
        }
        token = getNextToken();
      }
    } else if (token.endsWith('Glyphs')) {
      expectToken('[');
      expectToken(']');
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (token !== ';') {
        if (token === '{') {
          const offset = expectNumber();
          expectToken(',');
          const width = expectNumber();
          expectToken(',');
          const height = expectNumber();
          expectToken(',');
          const xAdvance = expectNumber();
          expectToken(',');
          const xOffset = expectNumber();
          expectToken(',');
          const yOffset = expectNumber();

          glyphs.push({
            offset,
            width,
            height,
            xAdvance,
            xOffset,
            yOffset,
          });

          expectToken(',', '}');
        }
        token = getNextToken();
        if (token === ',') {
          token = getNextToken();
        }
      }
    } else if (token === 'GFXfont') {
      name = getNextToken();
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (!token.endsWith('Glyphs')) {
        token = getNextToken();
      }
      expectToken(',');
      first = expectNumber();
      expectToken(',');
      last = expectNumber();
      expectToken(',');
      yAdvance = expectNumber();
      expectToken('}');
      token = getNextToken();
    } else {
      token = getNextToken();
    }
  }

  return {
    name,
    bitmaps,
    glyphs,
    first,
    last,
    yAdvance,
  };
}

export function toBytes(bits: boolean[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte |= (bits[i + j] ? 1 : 0) << (7 - j);
    }
    bytes.push(byte);
  }
  return bytes;
}


export function gfxFontFromString(fontString: string): GfxFont {
  return createGfxFont(parseFont(fontString));
}

export function toHex(value: number | string): string {
  const hex = (typeof value === 'string' ? value.charCodeAt(0) : value).toString(16);
  return `0x${hex.length % 2 === 1 ? '0' : ''}${hex}`;
}