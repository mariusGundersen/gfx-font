import { Signal } from "@preact/signals";
import { useRef } from "preact/hooks";
import { GfxGlyph } from "./GfxGlyph";
import { range } from "./gfx";

export function GlyphTable({
  glyph,
  tallest,
  lowest,
}: {
  glyph: InstanceType<typeof GfxGlyph>;
  tallest: Signal<number>;
  lowest: Signal<number>;
}) {
  const drawState = useRef<boolean>(false);

  const rows = range(
    tallest.value - glyph.yOffset.value,
    lowest.value - glyph.yOffset.value,
  );
  const cols = range(
    Math.min(0, -glyph.xOffset.value),
    Math.max(glyph.xAdvance.value, glyph.width.value),
  );

  return (
    <table id="glyph">
      <tbody>
        {rows.map((y) => (
          <tr key={y} td-row={y}>
            {cols.map((x) => (
              <td key={x}>
                <input
                  type="checkbox"
                  checked={glyph.getPixel(x, y) ? true : false}
                  disabled={
                    x < 0 ||
                    y < 0 ||
                    x >= glyph.width.value ||
                    y >= glyph.height.value
                  }
                  style={{
                    borderLeft:
                      -x === glyph.xOffset.value
                        ? "2px solid purple"
                        : undefined,
                    marginLeft: -x === glyph.xOffset.value ? "-1px" : undefined,
                    borderBottom:
                      y === -glyph.yOffset.value ? "2px solid red" : undefined,
                    marginBottom:
                      y === -glyph.yOffset.value ? "-1px" : undefined,
                    zIndex: y === -glyph.yOffset.value ? 1 : undefined,
                  }}
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
