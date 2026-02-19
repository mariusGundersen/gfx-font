import { useEffect, useRef, useState } from "preact/hooks";
import { GfxFont } from "./gfx";

export function Preview({
  font,
  refreshKey,
}: {
  font: GfxFont;
  refreshKey?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog",
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 10;
    const scale = 2;
    const fontHeight = font.yAdvance;
    const lines = previewText.split("\n");
    const maxWidth = Math.max(
      ...lines.map((line) => {
        let width = 0;
        for (let char = 0; char < line.length; char++) {
          const glyph = font.getGlyph(line.charCodeAt(char));
          width += glyph?.xAdvance || 0;
        }
        return width;
      }),
    );

    canvas.width = (maxWidth + padding * 2) * scale;
    canvas.height = (lines.length * fontHeight + padding * 2) * scale;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";

    ctx.scale(scale, scale);
    let y = fontHeight;
    for (const line of lines) {
      let x = padding;
      for (let char = 0; char < line.length; char++) {
        const glyph = font.getGlyph(line.charCodeAt(char));
        if (glyph) {
          for (let gy = 0; gy < glyph.height; gy++) {
            for (let gx = 0; gx < glyph.width; gx++) {
              if (glyph.gfx[gy]?.[gx]) {
                ctx.fillRect(
                  x + gx + glyph.xOffset,
                  y + gy + glyph.yOffset,
                  1,
                  1,
                );
              }
            }
          }
        }
        x += glyph?.xAdvance || 0;
      }
      y += fontHeight;
    }
  }, [font, previewText, refreshKey]);

  return (
    <fieldset>
      <legend>Preview</legend>
      <textarea
        rows={3}
        value={previewText}
        onInput={(e) => setPreviewText((e.target as HTMLTextAreaElement).value)}
      />
      <canvas ref={canvasRef}></canvas>
    </fieldset>
  );
}
