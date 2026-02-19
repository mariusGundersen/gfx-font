import { GfxGlyph } from "./GfxGlyph";

export function GlyphTable({ glyph }: { glyph: GfxGlyph }) {
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
                  onMouseLeave={(e) => {
                    if (e.buttons) {
                      glyph.setPixel(x, y, !e.currentTarget.checked);
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
