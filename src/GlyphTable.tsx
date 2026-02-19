import { useRef } from "preact/hooks";
import { GfxGlyph } from "./GfxGlyph";

export function GlyphTable({ glyph }: { glyph: GfxGlyph }) {
  const drawState = useRef<boolean>(false);
  return (
    <table id="glyph">
      <tbody>
        {glyph.rows.value.map((cols, y) => (
          <tr key={y}>
            {cols.map((x) => (
              <td key={x}>
                <input
                  type="checkbox"
                  checked={glyph.getPixel(x, y) ? true : false}
                  onChange={(e) => {
                    glyph.setPixel(x, y, e.currentTarget.checked);
                  }}
                  onMouseDown={(e) => {
                    drawState.current = !e.currentTarget.checked;
                  }}
                  onMouseEnter={(e) => {
                    if (e.buttons) {
                      glyph.setPixel(x, y, drawState.current);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (e.buttons) {
                      glyph.setPixel(x, y, drawState.current);
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
