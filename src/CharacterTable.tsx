import { GfxFont, GfxGlyph } from "./gfx";

export function CharacterTable({
  font,
  onSelectGlyph,
}: {
  font: GfxFont;
  onSelectGlyph: (glyph: GfxGlyph) => void;
}) {
  return (
    <table id="characters">
      <tbody>
        <tr>
          <th></th>
          {new Array(16).fill(0).map((_, i) => (
            <th key={i}>{`_${i.toString(16)}`}</th>
          ))}
        </tr>
        {new Array(16).fill(0).map((_, i) => (
          <tr key={i}>
            <th>{`${i.toString(16)}_`}</th>
            {new Array(16).fill(0).map((_, j) => {
              const glyph = font.getGlyph(i * 16 + j);
              return (
                <td
                  key={j}
                  onClick={() => glyph && onSelectGlyph(glyph)}
                  style={{
                    background: glyph
                      ? glyph.width === 0 || glyph.height === 0
                        ? "#ccc"
                        : "#cec"
                      : "#ecc",
                  }}
                >
                  {glyph?.char ?? ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
