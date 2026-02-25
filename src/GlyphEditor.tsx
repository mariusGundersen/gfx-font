import { Signal } from "@preact/signals";
import { toHex } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphTable } from "./GlyphTable";
import { CloseIcon } from "./icons";

export function GlyphEditor({
  glyph,
  onClose,
  copyFrom,
  tallest,
  lowest,
}: {
  glyph: InstanceType<typeof GfxGlyph>;
  onClose?: () => void;
  copyFrom(glyph: number): void;
  tallest: Signal<number>;
  lowest: Signal<number>;
}) {
  return (
    <fieldset>
      <legend>
        <strong>{glyph.char}</strong> <code>({toHex(glyph.char.value)})</code>
        <button class="close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </legend>

      <label>
        <span>Width</span>
        <input
          type="number"
          name="width"
          value={glyph.width.value}
          onChange={(e) => {
            glyph.setWidth(e.currentTarget.valueAsNumber);
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>Height</span>
        <input
          type="number"
          name="height"
          value={glyph.height.value}
          onChange={(e) => {
            glyph.setHeight(e.currentTarget.valueAsNumber);
          }}
          min="1"
          max="255"
        />
      </label>
      <label>
        <span>X offset</span>
        <input
          type="number"
          name="x-offset"
          value={glyph.xOffset.value}
          onChange={(e) => {
            glyph.xOffset.value = e.currentTarget.valueAsNumber;
          }}
          min="-255"
          max="255"
        />
      </label>
      <label>
        <span>Y offset</span>
        <input
          type="number"
          name="y-offset"
          value={glyph.yOffset.value}
          onChange={(e) => {
            glyph.yOffset.value = e.currentTarget.valueAsNumber;
          }}
          min="-255"
          max="255"
        />
      </label>
      <label>
        <span>X Advance</span>
        <input
          type="number"
          name="x-advance"
          value={glyph.xAdvance.value}
          onChange={(e) => {
            glyph.xAdvance.value = e.currentTarget.valueAsNumber;
          }}
          min="0"
          max="255"
        />
      </label>
      <GlyphTable glyph={glyph} tallest={tallest} lowest={lowest} />
      {glyph.width.value === 0 && glyph.height.value === 0 && (
        <label>
          Copy from
          <select onChange={(e) => copyFrom(parseInt(e.currentTarget.value))}>
            {new Array(256).fill(0).map((_, i) => (
              <option value={i}>
                {String.fromCharCode(i)} ({toHex(i)})
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  );
}
