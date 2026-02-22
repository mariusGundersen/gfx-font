import { useRef } from "preact/hooks";
import { GfxGlyph } from "./GfxGlyph";

export function GlyphTable({
  glyph,
}: {
  glyph: InstanceType<typeof GfxGlyph>;
}) {
  const drawState = useRef<boolean>(false);
  return (
    <table id="glyph">
      <tbody>
        {glyph.rows.value.map((cols, y) => (
          <tr key={y}>
            {cols.map((x) => (
              <td
                key={x}
                style={{
                  borderBottomColor:
                    y + glyph.yOffset.value == 0 ? "#a00" : undefined,
                  borderRightColor:
                    x == -1 || x - glyph.width.value == -1 ? "#a00" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={glyph.getPixel(x, y) ? true : false}
                  disabled={
                    x < 0 ||
                    y < 0 ||
                    x >= glyph.width.value ||
                    y >= glyph.height.value
                  }
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
