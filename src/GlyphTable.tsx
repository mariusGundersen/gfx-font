import { useState } from "preact/hooks";
import { GfxGlyph } from "./gfx";

export function GlyphTable({
  glyph,
  onChange,
}: {
  glyph: GfxGlyph;
  onChange?: () => void;
}) {
  const [, setRefresh] = useState(0);

  const refresh = () => {
    setRefresh((prev) => prev + 1);
    onChange?.();
  };

  return (
    <table id="glyph">
      <tbody>
        {glyph.gfx.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => (
              <td key={x}>
                <input
                  type="checkbox"
                  checked={cell ? true : false}
                  onChange={(e) => {
                    glyph.setPixel(
                      x,
                      y,
                      (e.target as HTMLInputElement).checked,
                    );
                    refresh();
                  }}
                  onMouseLeave={(e) => {
                    if ((e as MouseEvent).buttons) {
                      glyph.setPixel(
                        x,
                        y,
                        !(e.target as HTMLInputElement).checked,
                      );
                      refresh();
                    }
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
