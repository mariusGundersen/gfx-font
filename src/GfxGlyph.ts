import { computed, ReadonlySignal, signal } from '@preact/signals';
import { ParsedGlyph, toBytes } from './gfx';

interface SerializedGlyph {
  width: number;
  height: number;
  xAdvance: number;
  xOffset: number;
  yOffset: number;
  bytes: number[]
}

export function createGfxGlyph(
  char: string,
  bytes: number[] = [],
  glyphData: ParsedGlyph = {
    height: 0,
    width: 0,
    offset: 0,
    xAdvance: 0,
    xOffset: 0,
    yOffset: 0,
  }
) {
  const widthSignal = signal(glyphData.width);
  const heightSignal = signal(glyphData.height);
  const xAdvanceSignal = signal(glyphData.xAdvance);
  const xOffsetSignal = signal(glyphData.xOffset);
  const yOffsetSignal = signal(glyphData.yOffset);
  const gfxSignal = signal<boolean[][]>(parseBytes(bytes, glyphData.width, glyphData.height));

  const setPixel = (x: number, y: number, value: boolean) => {
    const width = widthSignal.value;
    const height = heightSignal.value;
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    const newGfx = [...gfxSignal.value];
    newGfx[y] = [...newGfx[y]];
    newGfx[y][x] = value;
    gfxSignal.value = newGfx;
  };

  const setWidth = (value: number) => {
    if (value < 0) {
      throw new Error('Width must be a positive number');
    }

    const currentWidth = widthSignal.value;
    if (value < currentWidth) {
      const newGfx = gfxSignal.value.map((row) => row.slice(0, value));
      gfxSignal.value = newGfx;
    } else if (value > currentWidth) {
      const newGfx = gfxSignal.value.map((row) => [...row, ...new Array(value - currentWidth).fill(false)]);
      gfxSignal.value = newGfx;
    }

    widthSignal.value = value;
  };

  const setHeight = (value: number) => {
    if (value < 0) {
      throw new Error('Height must be a positive number');
    }

    const currentHeight = heightSignal.value;
    if (value < currentHeight) {
      gfxSignal.value = gfxSignal.value.slice(0, value);
    } else if (value > currentHeight) {
      const width = widthSignal.value;
      gfxSignal.value = [...gfxSignal.value, ...new Array(value - currentHeight).fill('x').map(() => new Array(width).fill(false))];
    }

    heightSignal.value = value;
  };

  return {
    get char() {
      return char;
    },
    width: widthSignal as ReadonlySignal<number>,
    height: heightSignal as ReadonlySignal<number>,
    xAdvance: xAdvanceSignal,
    xOffset: xOffsetSignal,
    yOffset: yOffsetSignal,
    rows: computed(() => gfxSignal.value.map((r) => r.map((_, i) => i))),
    getPixel: (x: number, y: number) => {
      const height = heightSignal.value;
      const width = widthSignal.value;
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return false;
      }
      return gfxSignal.value[y]?.[x] ?? false;
    },
    setPixel,
    setWidth,
    setHeight,
    serialize: () => ({
      bytes: toBytes(gfxSignal.value.flat()),
      width: widthSignal.value,
      height: heightSignal.value,
      xAdvance: xAdvanceSignal.value,
      xOffset: xOffsetSignal.value,
      yOffset: yOffsetSignal.value,
      char,
    }),
    copyFrom({ bytes, width, height, xAdvance, xOffset, yOffset }: SerializedGlyph) {
      gfxSignal.value = parseBytes(bytes, width, height);
      widthSignal.value = width;
      heightSignal.value = height;
      xAdvanceSignal.value = xAdvance;
      xOffsetSignal.value = xOffset;
      yOffsetSignal.value = yOffset;
    }
  };
}

export type GfxGlyph = ReturnType<typeof createGfxGlyph>;

const parseBytes = (bytes: number[], width: number, height: number) => {
  const gfx: boolean[][] = [];
  let pix = 0;
  let byte = 0;
  let j = -1;
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      if (j < 0) {
        j = 7;
        byte = bytes[pix++];
      }
      const ink = ((byte >> j) & 1) ? true : false;
      row.push(ink);
      j--;
    }
    gfx.push(row);
  }
  return gfx;
};