import { computed } from "@preact/signals";
import { toHex } from "./gfx";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphTable } from "./GlyphTable";

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
        Edit {glyph.char} ({computed(() => toHex(glyph.char.value))})
        <button class="close-btn" onClick={onClose}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
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
