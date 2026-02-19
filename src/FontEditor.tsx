import { CharacterTable } from "./CharacterTable";
import { GfxFont, GfxGlyph } from "./gfx";

export function FontEditor({
  font,
  onSelectGlyph,
}: {
  font: GfxFont;
  onSelectGlyph: (glyph: GfxGlyph) => void;
}) {
  return (
    <fieldset>
      <legend>Font Settings</legend>
      <label>
        <span>Name</span>
        <input
          type="text"
          name="name"
          value={font.name}
          onInput={(e) => {
            font.name = (e.target as HTMLInputElement).value;
          }}
        />
      </label>
      <label>
        <span>First character</span>
        <input
          type="number"
          name="first-char"
          value={font.first}
          onInput={(e) => {
            font.first = (e.target as HTMLInputElement).valueAsNumber;
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>Last character</span>
        <input
          type="number"
          name="last-char"
          value={font.last}
          onInput={(e) => {
            font.last = (e.target as HTMLInputElement).valueAsNumber;
          }}
          min="1"
          max="255"
        />
      </label>
      <CharacterTable font={font} onSelectGlyph={onSelectGlyph} />
    </fieldset>
  );
}
