import { computed, createModel, ReadonlySignal, signal } from "@preact/signals";
import { ParsedFont, toHex } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";

export const GfxFont = createModel((parsedFont: ParsedFont) => {
  const nameSignal = signal(parsedFont.name);
  const firstSignal = signal(parsedFont.first);
  const lastSignal = signal(parsedFont.last);
  const yAdvanceSignal = signal(parsedFont.yAdvance);
  const glyphsSignal = signal(
    parsedFont.glyphs.map(
      (g, i) =>
        new GfxGlyph(
          String.fromCharCode(i + parsedFont.first),
          parsedFont.bitmaps.slice(g.offset),
          g
        )
    )
  );

  return {
    name: nameSignal,
    first: firstSignal as ReadonlySignal<number>,
    setFirst(value: number) {
      const currentFirst = firstSignal.value;
      value = Math.min(value, lastSignal.value);
      if (value < currentFirst) {
        const newGlyphs = [...Array(currentFirst - value).fill(0).map((_, i) => new GfxGlyph(String.fromCharCode(value + i)))];
        glyphsSignal.value = [...newGlyphs, ...glyphsSignal.value];
      } else if (value > currentFirst) {
        glyphsSignal.value = glyphsSignal.value.slice(value - currentFirst);
      }
      firstSignal.value = value;
    },
    last: lastSignal as ReadonlySignal<number>,
    setLast(value: number) {
      const currentLast = lastSignal.value;
      value = Math.max(value, firstSignal.value);
      if (value > currentLast) {
        const newGlyphs = [...Array(value - currentLast).fill(0).map((_, i) => new GfxGlyph(String.fromCharCode(currentLast + 1 + i)))];
        glyphsSignal.value = [...glyphsSignal.value, ...newGlyphs];
      } else if (value < currentLast) {
        glyphsSignal.value = glyphsSignal.value.slice(0, value - firstSignal.value + 1);
      }
      lastSignal.value = value;
    },
    yAdvance: yAdvanceSignal,
    getGlyph(charCode: number) {
      const first = firstSignal.value;
      const last = lastSignal.value;
      const glyphs = glyphsSignal.value;
      if (charCode >= first && charCode <= last) {
        return glyphs[charCode - first];
      }
      return null;
    },
    tallest: computed(() => Math.min(...glyphsSignal.value.map((g) => g.yOffset.value))),
    lowest: computed(() => Math.max(...glyphsSignal.value.map((g) => g.height.value + g.yOffset.value))),
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
});