import { computed } from "@preact/signals";
import { toHex } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphTable } from "./GlyphTable";
import { CloseIcon } from "./icons";

export function GlyphEditor({
  glyph,
  onClose,
}: {
  glyph: GfxGlyph;
  onClose?: () => void;
}) {
  return (
    <fieldset>
      <legend>
        <strong>{glyph.char}</strong>{" "}
        <code>({computed(() => toHex(glyph.char.value))})</code>
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
          onInput={(e) => {
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
          onInput={(e) => {
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
          onInput={(e) => {
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
          onInput={(e) => {
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
          onInput={(e) => {
            glyph.xAdvance.value = e.currentTarget.valueAsNumber;
          }}
          min="0"
          max="255"
        />
      </label>
      <GlyphTable glyph={glyph} />
    </fieldset>
  );
}
