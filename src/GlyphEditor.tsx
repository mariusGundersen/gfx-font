import { useState } from "preact/hooks";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphTable } from "./GlyphTable";

export function GlyphEditor({
  glyph,
  onClose,
  onChange,
}: {
  glyph: GfxGlyph;
  onClose?: () => void;
  onChange?: () => void;
}) {
  const [, setRefresh] = useState(0);

  const refresh = () => {
    setRefresh((prev) => prev + 1);
    onChange?.();
  };

  return (
    <fieldset>
      <legend>
        Glyph Editor
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
          value={glyph.width}
          onInput={(e) => {
            glyph.width = (e.target as HTMLInputElement).valueAsNumber;
            refresh();
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
          value={glyph.height}
          onInput={(e) => {
            glyph.height = (e.target as HTMLInputElement).valueAsNumber;
            refresh();
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
          value={glyph.xOffset}
          onInput={(e) => {
            glyph.xOffset = (e.target as HTMLInputElement).valueAsNumber;
            refresh();
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
          value={glyph.yOffset}
          onInput={(e) => {
            glyph.yOffset = (e.target as HTMLInputElement).valueAsNumber;
            refresh();
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
          value={glyph.xAdvance}
          onInput={(e) => {
            glyph.xAdvance = (e.target as HTMLInputElement).valueAsNumber;
            refresh();
          }}
          min="0"
          max="255"
        />
      </label>
      <GlyphTable glyph={glyph} onChange={refresh} />
    </fieldset>
  );
}
