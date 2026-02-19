import { ParsedFont, parseFont } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";


export class GfxFont {
  private _first: number;
  private _last: number;
  name: string;
  yAdvance: number;
  glyphs: GfxGlyph[];

  constructor(parsedFont: ParsedFont) {
    this._first = parsedFont.first;
    this._last = parsedFont.last;
    this.name = parsedFont.name;
    this.yAdvance = parsedFont.yAdvance;
    this.glyphs = parsedFont.glyphs.map(
      (g, i) => new GfxGlyph(
        String.fromCharCode(i + parsedFont.first),
        parsedFont.bitmaps.slice(g.offset),
        g
      )
    );
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
  }

  getGlyph(charCode: number): GfxGlyph | null {
    if (charCode >= this.first && charCode <= this.last) {
      return this.glyphs[charCode - this.first];
    }
    return null;
  }
}

export function serialize(font: GfxFont): string {
    let offset = 0;
    const glyphsSerialized = font.glyphs.map((g) => g.serialize()).map((g) => ({
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
const uint8_t ${font.name}Bitmaps[] PROGMEM = {
${glyphsSerialized
        .filter((g) => g.bytes.length > 0)
        .map((g) => `  ${g.bytes.join(', ')},`)
        .join('\n')}
};

const GFXglyph ${font.name}Glyphs[] PROGMEM = {
${glyphsSerialized
        .map(
          (g) => `  {  ${g.offset.toString().padStart(maxOffset, ' ')},  ${g.width.padStart(maxWidth, ' ')},  ${g.height.padStart(maxHeight, ' ')},  ${g.xAdvance.padStart(maxXAdvance, ' ')},  ${g.xOffset.padStart(maxXOffset, ' ')},  ${g.yOffset.padStart(maxYOffset, ' ')}, }, /* 0x${g.code} '${g.char}' */`
        )
        .join('\n')}
};

const GFXfont ${font.name} PROGMEM = {
  (uint8_t  *)${font.name}Bitmaps,
  (GFXglyph *)${font.name}Glyphs,
  0x${font.first.toString(16)}, 0x${font.last.toString(16)}, ${font.yAdvance} };
    `.trim();
  }