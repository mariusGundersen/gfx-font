import { effect } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { GfxFont } from "./GfxFont";

export function Preview({ font }: { font: InstanceType<typeof GfxFont> }) {
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog",
  );

  return (
    <fieldset>
      <legend>Preview</legend>
      <textarea
        rows={3}
        value={previewText}
        onInput={(e) => setPreviewText(e.currentTarget.value)}
      />
      <PreviewCanvas font={font} previewText={previewText} />
    </fieldset>
  );
}

interface PreviewCanvasProps {
  font: InstanceType<typeof GfxFont>;
  previewText: string;
  scale?: number;
  padding?: number;
  bgColor?: string;
  fgColor?: string;
}

export function PreviewCanvas({
  font,
  previewText,
  scale = 2,
  padding = 10,
  bgColor = "#000",
  fgColor = "#fff",
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return effect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const lines = previewText.split("\n");
      const maxWidth = Math.max(
        ...lines.map((line) => {
          let width = 0;
          for (let char = 0; char < line.length; char++) {
            const glyph = font.getGlyph(line.charCodeAt(char));
            width += glyph
              ? Math.max(
                  glyph.xAdvance.value,
                  glyph.width.value + glyph.xOffset.value,
                )
              : 0;
          }
          return width;
        }),
      );

      canvas.width = (maxWidth + padding * 2) * scale;
      canvas.height =
        (lines.length * font.yAdvance.value + padding * 2) * scale;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = fgColor;

      ctx.scale(scale, scale);
      let y = font.getTallest() + padding;
      for (const line of lines) {
        let x = padding;
        for (let char = 0; char < line.length; char++) {
          const glyph = font.getGlyph(line.charCodeAt(char));
          if (glyph) {
            for (let gy = 0; gy < glyph.height.value; gy++) {
              for (let gx = 0; gx < glyph.width.value; gx++) {
                if (glyph.getPixel(gx, gy)) {
                  ctx.fillRect(
                    x + gx + glyph.xOffset.value,
                    y + gy + glyph.yOffset.value,
                    1,
                    1,
                  );
                }
              }
            }
          }
          x += glyph?.xAdvance.value || 0;
        }
        y += font.yAdvance.value;
      }
    });
  }, [font, previewText, scale, padding, bgColor, fgColor]);

  return <canvas ref={canvasRef} />;
}
