interface ParsedGlyph {
  offset: number;
  width: number;
  height: number;
  xAdvance: number;
  xOffset: number;
  yOffset: number;
}

interface ParsedFont {
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

export class GfxFont {
  private _first: number;
  private _last: number;
  name: string;
  yAdvance: number;
  glyphs: GfxGlyph[];
  private _maxHeight = 0;

  constructor(parsedFont: ParsedFont) {
    this._first = parsedFont.first;
    this._last = parsedFont.last;
    this.name = parsedFont.name;
    this.yAdvance = parsedFont.yAdvance;
    this.glyphs = parsedFont.glyphs.map(
      (g, i) =>
        new GfxGlyph(
          String.fromCharCode(i + parsedFont.first),
          parsedFont.bitmaps.slice(g.offset),
          g
        )
    );
    this.updateMaxHeight();
  }

  private updateMaxHeight() {
    this._maxHeight = Math.max(
      ...this.glyphs.map((g) => g.height),
      this.yAdvance
    );
  }

  get maxHeight(): number {
    return this._maxHeight;
  }

  static fromString(fontString: string): GfxFont {
    return new GfxFont(parseFont(fontString));
  }

  get first(): number {
    return this._first;
  }

  set first(value: number) {
    if (value < this._first) {
      this.glyphs.unshift(
        ...new Array(this._first - value)
          .fill(0)
          .map((_, i) => new GfxGlyph(String.fromCharCode(value + i)))
      );
    } else if (value > this._first) {
      this.glyphs.splice(0, value - this._first);
    }
    this._first = value;
    this.updateMaxHeight();
  }

  get last(): number {
    return this._last;
  }

  set last(value: number) {
    if (value > this._last) {
      this.glyphs.push(
        ...new Array(value - this._last)
          .fill(0)
          .map((_, i) => new GfxGlyph(String.fromCharCode(this._last + 1 + i)))
      );
    } else if (value < this._last) {
      this.glyphs.splice(value - this._first + 1);
    }
    this._last = value;
    this.updateMaxHeight();
  }

  getGlyph(charCode: number): GfxGlyph | null {
    if (charCode >= this.first && charCode <= this.last) {
      return this.glyphs[charCode - this.first];
    }
    return null;
  }

  serialize(): string {
    let offset = 0;
    const glyphsSerialized = this.glyphs.map((g) => g.serialize()).map((g) => ({
      width: g.width.toString(),
      height: g.height.toString(),
      bytes: g.bytes.map((b) => `0x${b.toString(16).padStart(2, '0')}`),
      xAdvance: g.xAdvance.toString(),
      xOffset: g.xOffset.toString(),
      yOffset: g.yOffset.toString(),
      char: g.char,
      code: g.char.charCodeAt(0).toString(16).padStart(2, '0'),
      offset: (offset += g.bytes.length) - g.bytes.length,
    }));

    const maxOffset = offset.toString().length;
    const maxWidth = Math.max(...glyphsSerialized.map((g) => g.width.length));
    const maxHeight = Math.max(...glyphsSerialized.map((g) => g.height.length));
    const maxXAdvance = Math.max(
      ...glyphsSerialized.map((g) => g.xAdvance.length)
    );
    const maxXOffset = Math.max(
      ...glyphsSerialized.map((g) => g.xOffset.length)
    );
    const maxYOffset = Math.max(
      ...glyphsSerialized.map((g) => g.yOffset.length)
    );

    return `
const uint8_t ${this.name}Bitmaps[] PROGMEM = {
${glyphsSerialized
  .filter((g) => g.bytes.length > 0)
  .map((g) => `  ${g.bytes.join(', ')},`)
  .join('\n')}
};

const GFXglyph ${this.name}Glyphs[] PROGMEM = {
${glyphsSerialized
  .map(
    (g) =>
      `  {  ${g.offset.toString().padStart(maxOffset, ' ')},  ${g.width.padStart(maxWidth, ' ')},  ${g.height.padStart(maxHeight, ' ')},  ${g.xAdvance.padStart(maxXAdvance, ' ')},  ${g.xOffset.padStart(maxXOffset, ' ')},  ${g.yOffset.padStart(maxYOffset, ' ')}, }, /* 0x${g.code} '${g.char}' */`
  )
  .join('\n')}
};

const GFXfont ${this.name} PROGMEM = {
  (uint8_t  *)${this.name}Bitmaps,
  (GFXglyph *)${this.name}Glyphs,
  0x${this.first.toString(16)}, 0x${this.last.toString(16)}, ${this.yAdvance} };
    `.trim();
  }
}

export class GfxGlyph {
  char: string;
  glyph: ParsedGlyph;
  gfx: boolean[][];
  xAdvance: number;
  xOffset: number;
  yOffset: number;

  constructor(
    char: string,
    bytes: number[] = [],
    glyph: ParsedGlyph = {
      height: 0,
      width: 0,
      offset: 0,
      xAdvance: 0,
      xOffset: 0,
      yOffset: 0,
    }
  ) {
    this.char = char;
    this.glyph = glyph;
    this.gfx = [];
    this.parseBytes(bytes);
    this.xAdvance = glyph.xAdvance;
    this.xOffset = glyph.xOffset;
    this.yOffset = glyph.yOffset;
  }

  parseBytes(bytes: number[]): void {
    this.gfx = [];
    let pix = 0;
    let byte = 0;
    let j = -1;
    for (let y = 0; y < this.glyph.height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < this.glyph.width; x++) {
        if (j < 0) {
          j = 7;
          byte = bytes[pix++];
        }
        const ink = ((byte >> j) & 1) ? true : false;

        row.push(ink);
        j--;
      }

      this.gfx.push(row);
    }
  }

  getBytes(): number[] {
    return toBytes(this.gfx.flat());
  }

  get width(): number {
    return this.glyph.width;
  }

  set width(value: number) {
    if (value < 0) {
      throw new Error('Width must be a positive number');
    }

    if (value < this.glyph.width) {
      for (let y = 0; y < this.glyph.height; y++) {
        this.gfx[y].splice(value);
      }
    } else if (value > this.glyph.width) {
      for (let y = 0; y < this.glyph.height; y++) {
        while (this.gfx[y].length < value) {
          this.gfx[y].push(false);
        }
      }
    }

    this.glyph.width = value;
  }

  get height(): number {
    return this.glyph.height;
  }

  set height(value: number) {
    if (value < 0) {
      throw new Error('Height must be a positive number');
    }

    if (value < this.glyph.height) {
      this.gfx.splice(value);
    } else if (value > this.glyph.height) {
      while (this.gfx.length < value) {
        this.gfx.push(new Array(this.glyph.width).fill(false));
      }
    }

    this.glyph.height = value;
  }

  getPixel(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return false;
    }
    return this.gfx[y][x];
  }

  setPixel(x: number, y: number, value: boolean): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }
    this.gfx[y][x] = value;
  }

  serialize(): {
    bytes: number[];
    width: number;
    height: number;
    xAdvance: number;
    xOffset: number;
    yOffset: number;
    char: string;
  } {
    return {
      bytes: this.getBytes(),
      width: this.width,
      height: this.height,
      xAdvance: this.xAdvance,
      xOffset: this.xOffset,
      yOffset: this.yOffset,
      char: this.char,
    };
  }
}

function toBytes(bits: boolean[]): number[] {
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
