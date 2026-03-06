import { Signal } from "@preact/signals";
import { toBytes, toHex } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphTable } from "./GlyphTable";
import { CloseIcon, CopyIcon, PasteIcon } from "./icons";

function renderGlyphToCanvas(
  glyph: InstanceType<typeof GfxGlyph>,
  scale = 1,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = glyph.width.value;
  const height = glyph.height.value;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  for (let y = 0; y < glyph.height.value; y++) {
    for (let x = 0; x < glyph.width.value; x++) {
      if (glyph.getPixel(x, y)) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return canvas;
}

async function copyGlyph(glyph: InstanceType<typeof GfxGlyph>) {
  const bits: boolean[] = [];
  for (let y = 0; y < glyph.height.value; y++) {
    for (let x = 0; x < glyph.width.value; x++) {
      bits.push(glyph.getPixel(x, y));
    }
  }
  const bytes = toBytes(bits);
  const hexList = bytes.map(toHex).join(", ");

  const canvas = renderGlyphToCanvas(glyph);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (blob) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
        "text/plain": new Blob([hexList], { type: "text/plain" }),
      }),
    ]);
  }
}

async function pasteGlyph(
  glyph: InstanceType<typeof GfxGlyph>,
  onPaste: (
    char: string,
    width: number,
    height: number,
    pixels: boolean[][],
  ) => void,
) {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    if (item.types.includes("image/png")) {
      const blob = await item.getType("image/png");
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels: boolean[][] = [];
      for (let y = 0; y < img.height; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          row.push(imageData.data[i] < 128);
        }
        pixels.push(row);
      }
      onPaste("", img.width, img.height, pixels);
      return;
    }
    if (item.types.includes("text/plain")) {
      const blob = await item.getType("text/plain");
      const text = await blob.text();
      const hexMatches = text.matchAll(/(?:0x)?([0-9a-fA-F]{2})/g);
      const bytes: number[] = [];
      for (const match of hexMatches) {
        bytes.push(parseInt(match[1], 16));
      }
      if (bytes.length > 0) {
        const bits: boolean[] = [];
        for (const byte of bytes) {
          for (let j = 7; j >= 0; j--) {
            bits.push((byte & (1 << j)) !== 0);
          }
        }
        const width = glyph.width.value || 8;
        const height = Math.ceil(bits.length / width);
        const pixels: boolean[][] = [];
        for (let y = 0; y < height; y++) {
          const row: boolean[] = [];
          for (let x = 0; x < width; x++) {
            row.push(bits[y * width + x] ?? false);
          }
          pixels.push(row);
        }
        onPaste("", width, height, pixels);
        return;
      }
      if (text.length === 1) {
        onPaste(text, 0, 0, []);
      }
    }
  }
}

export function GlyphEditor({
  glyph,
  onClose,
  copyFrom,
  tallest,
  lowest,
}: {
  glyph: InstanceType<typeof GfxGlyph>;
  onClose?: () => void;
  copyFrom(glyph: number): void;
  tallest: Signal<number>;
  lowest: Signal<number>;
}) {
  const handlePaste = (
    char: string,
    width: number,
    height: number,
    pixels: boolean[][],
  ) => {
    if (char) {
      copyFrom(char.charCodeAt(0));
    } else if (width > 0 && height > 0) {
      glyph.setWidth(width);
      glyph.setHeight(height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          glyph.setPixel(x, y, pixels[y]?.[x] ?? false);
        }
      }
    }
  };

  return (
    <fieldset>
      <legend>
        <strong>{glyph.char}</strong> <code>({toHex(glyph.char.value)})</code>
        <button class="close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </legend>

      <div class="copy-paste-buttons">
        <button onClick={() => copyGlyph(glyph)} title="Copy as text and PNG">
          <CopyIcon /> Copy
        </button>
        <button
          onClick={() => pasteGlyph(glyph, handlePaste)}
          title="Paste from clipboard"
        >
          <PasteIcon /> Paste
        </button>
      </div>

      <label>
        <span>Width</span>
        <input
          type="number"
          name="width"
          value={glyph.width.value}
          onChange={(e) => {
            glyph.setWidth(e.currentTarget.valueAsNumber);
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>Height</span>
        <input
          type="number"
          name="height"
          value={glyph.height.value}
          onChange={(e) => {
            glyph.setHeight(e.currentTarget.valueAsNumber);
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>X offset</span>
        <input
          type="number"
          name="x-offset"
          value={glyph.xOffset.value}
          onChange={(e) => {
            glyph.xOffset.value = e.currentTarget.valueAsNumber;
          }}
          min="-255"
          max="255"
        />
      </label>
      <label>
        <span>Y offset</span>
        <input
          type="number"
          name="y-offset"
          value={glyph.yOffset.value}
          onChange={(e) => {
            glyph.yOffset.value = e.currentTarget.valueAsNumber;
          }}
          min="-255"
          max="255"
        />
      </label>
      <label>
        <span>X Advance</span>
        <input
          type="number"
          name="x-advance"
          value={glyph.xAdvance.value}
          onChange={(e) => {
            glyph.xAdvance.value = e.currentTarget.valueAsNumber;
          }}
          min="0"
          max="255"
        />
      </label>
      <GlyphTable glyph={glyph} tallest={tallest} lowest={lowest} />
      {glyph.width.value === 0 && glyph.height.value === 0 && (
        <label>
          Copy from
          <select onChange={(e) => copyFrom(parseInt(e.currentTarget.value))}>
            {new Array(256).fill(0).map((_, i) => (
              <option value={i}>
                {String.fromCharCode(i)} ({toHex(i)})
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  );
}
