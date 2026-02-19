import { ParsedGlyph, toBytes } from "./gfx";


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
