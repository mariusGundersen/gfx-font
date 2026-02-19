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

function parseFont(cCode: string): ParsedFont {
  const tokens = cCode.split(/\s+/);

  const getNextToken = (): string => {
    let token = tokens.shift();
    while (token === '/*' || token === '/**') {
      do {
        token = tokens.shift();
      } while (token !== '*/');
      token = tokens.shift();
    }
    if (token === undefined) {
      throw new Error('Unexpected end of tokens');
    }
    return token;
  };

  const expectToken = (...expected: string[]): string => {
    const token = getNextToken();
    if (!expected.includes(token)) {
      throw new Error(`Expected token "${expected}", got "${token}"`);
    }
    return token;
  };

  const expectNumber = (token = getNextToken()): number => {
    const number = parseInt(token);
    if (isNaN(number)) {
      throw new Error(`Expected number, got "${token}"`);
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
  while (tokens.length > 0) {
    if (token.endsWith('Bitmaps[]')) {
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (token !== '};') {
        if (token.endsWith(',')) {
          token = token.slice(0, -1);
        }
        if (token.startsWith('0x')) {
          bitmaps.push(parseInt(token, 16));
        }
        token = getNextToken();
      }
    } else if (token.endsWith('Glyphs[]')) {
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (token !== '};') {
        if (token === '{') {
          const offset = expectNumber();
          const width = expectNumber();
          const height = expectNumber();
          const xAdvance = expectNumber();
          const xOffset = expectNumber();
          const yOffset = expectNumber();

          glyphs.push({
            offset,
            width,
            height,
            xAdvance,
            xOffset,
            yOffset,
          });

          expectToken('}', '},');
        }
        token = getNextToken();
      }
    } else if (token === 'GFXfont') {
      name = getNextToken();
      expectToken('PROGMEM');
      expectToken('=');
      expectToken('{');
      token = getNextToken();
      while (!token.endsWith('Glyphs,')) {
        token = getNextToken();
      }

      first = expectNumber();
      last = expectNumber();
      yAdvance = expectNumber();
      expectToken('};');
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