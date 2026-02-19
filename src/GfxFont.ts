import { signal } from "@preact/signals";
import { ParsedFont, toHex } from "./gfx";
import { createGfxGlyph, GfxGlyph } from "./GfxGlyph";

export function createGfxFont(parsedFont: ParsedFont) {
  const nameSignal = signal(parsedFont.name);
  const firstSignal = signal(parsedFont.first);
  const lastSignal = signal(parsedFont.last);
  const yAdvanceSignal = signal(parsedFont.yAdvance);
  const glyphsSignal = signal<GfxGlyph[]>(
    parsedFont.glyphs.map(
      (g, i) =>
        createGfxGlyph(
          String.fromCharCode(i + parsedFont.first),
          parsedFont.bitmaps.slice(g.offset),
          g
        )
    )
  );

  return {
    get name() {
      return nameSignal.value;
    },
    set name(value: string) {
      nameSignal.value = value;
    },
    get first() {
      return firstSignal.value;
    },
    set first(value: number) {
      const currentFirst = firstSignal.value;
      if (value < currentFirst) {
        const newGlyphs = [...Array(currentFirst - value).fill(0).map((_, i) => createGfxGlyph(String.fromCharCode(value + i)))];
        glyphsSignal.value = [...newGlyphs, ...glyphsSignal.value];
      } else if (value > currentFirst) {
        glyphsSignal.value = glyphsSignal.value.slice(value - currentFirst);
      }
      firstSignal.value = value;
    },
    get last() {
      return lastSignal.value;
    },
    set last(value: number) {
      const currentLast = lastSignal.value;
      if (value > currentLast) {
        const newGlyphs = [...Array(value - currentLast).fill(0).map((_, i) => createGfxGlyph(String.fromCharCode(currentLast + 1 + i)))];
        glyphsSignal.value = [...glyphsSignal.value, ...newGlyphs];
      } else if (value < currentLast) {
        glyphsSignal.value = glyphsSignal.value.slice(0, value - firstSignal.value + 1);
      }
      lastSignal.value = value;
    },
    get yAdvance() {
      return yAdvanceSignal.value;
    },
    set yAdvance(value: number) {
      yAdvanceSignal.value = value;
    },
    getGlyph(charCode: number) {
      const first = firstSignal.value;
      const last = lastSignal.value;
      const glyphs = glyphsSignal.value;
      if (charCode >= first && charCode <= last) {
        return glyphs[charCode - first];
      }
      return null;
    },
    serialize: () => {
      const name = nameSignal.value;
      const first = firstSignal.value;
      const last = lastSignal.value;
      const yAdvance = yAdvanceSignal.value;
      const glyphs = glyphsSignal.value;

      let offset = 0;
      const glyphsSerialized = glyphs.map((g) => g.serialize()).map((g) => ({
        width: g.width.toString(),
        height: g.height.toString(),
        bytes: g.bytes.map(toHex),
        xAdvance: g.xAdvance.toString(),
        xOffset: g.xOffset.toString(),
        yOffset: g.yOffset.toString(),
        char: g.char,
        offset: (offset += g.bytes.length) - g.bytes.length,
      }));

      const maxOffset = offset.toString().length;
      const maxWidth = Math.max(...glyphsSerialized.map((g) => g.width.length));
      const maxHeight = Math.max(...glyphsSerialized.map((g) => g.height.length));
      const maxXAdvance = Math.max(...glyphsSerialized.map((g) => g.xAdvance.length));
      const maxXOffset = Math.max(...glyphsSerialized.map((g) => g.xOffset.length));
      const maxYOffset = Math.max(...glyphsSerialized.map((g) => g.yOffset.length));

      return `
const uint8_t ${name}Bitmaps[] PROGMEM = {
${glyphsSerialized.filter((g) => g.bytes.length > 0).map((g) => `  ${g.bytes.join(', ')},`).join('\n')}
};

const GFXglyph ${name}Glyphs[] PROGMEM = {
${glyphsSerialized.map((g) => `  {  ${g.offset.toString().padStart(maxOffset, ' ')},  ${g.width.padStart(maxWidth, ' ')},  ${g.height.padStart(maxHeight, ' ')},  ${g.xAdvance.padStart(maxXAdvance, ' ')},  ${g.xOffset.padStart(maxXOffset, ' ')},  ${g.yOffset.padStart(maxYOffset, ' ')}, }, /* ${toHex(g.char)} '${g.char}' */`).join('\n')}
};

const GFXfont ${name} PROGMEM = {
  (uint8_t  *)${name}Bitmaps,
  (GFXglyph *)${name}Glyphs,
  ${toHex(first)}, ${toHex(last)}, ${yAdvance} };
      `.trim();
    },
  };
}

export type GfxFont = ReturnType<typeof createGfxFont>;