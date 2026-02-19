import { GfxGlyph } from "./GfxGlyph";

export function GlyphTable({ glyph }: { glyph: GfxGlyph }) {
  return (
    <table id="glyph">
      <tbody>
        {glyph.gfx.value.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => (
              <td key={x}>
                <input
                  type="checkbox"
                  checked={cell ? true : false}
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
