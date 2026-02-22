import { CharacterTable } from "./CharacterTable";
import { GfxFont } from "./GfxFont";
import { GfxGlyph } from "./GfxGlyph";

export function FontEditor({
  font,
  onSelectGlyph,
}: {
  font: InstanceType<typeof GfxFont>;
  onSelectGlyph: (glyph: InstanceType<typeof GfxGlyph>) => void;
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
            font.name.value = e.currentTarget.value;
          }}
        />
      </label>
      <label>
        <span>First character</span>
        <input
          type="number"
          name="first-char"
          value={font.first}
          onChange={(e) => {
            font.setFirst(e.currentTarget.valueAsNumber);
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
          value={font.last.value}
          onChange={(e) => {
            font.setLast(e.currentTarget.valueAsNumber);
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>Y Advance</span>
        <input
          type="number"
          name="first-char"
          value={font.yAdvance}
          onChange={(e) => {
            font.yAdvance.value = e.currentTarget.valueAsNumber;
          }}
          min="0"
          max="255"
        />
      </label>
      <CharacterTable font={font} onSelectGlyph={onSelectGlyph} />
    </fieldset>
  );
}
