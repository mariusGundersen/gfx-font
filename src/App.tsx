import { signal } from "@preact/signals";
import { useState } from "preact/hooks";
import { FontEditor } from "./FontEditor";
import { gfxFontFromString } from "./gfx";
import { GfxFont } from "./GfxFont";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphEditor } from "./GlyphEditor";
import { Preview } from "./Preview";
import { DownloadIcon, UploadIcon } from "./icons";

const fontSignal = signal<GfxFont | null>(null);
const glyphsSignal = signal<GfxGlyph[]>([]);

export function App({ initialFont }: { initialFont: GfxFont | null }) {
  if (fontSignal.value === null && initialFont) {
    fontSignal.value = initialFont;
  }

  const [, setRefresh] = useState(0);

  const handleUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        fontSignal.value = gfxFontFromString(text);
        glyphsSignal.value = [];
        setRefresh((r) => r + 1);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const font = fontSignal.value;
    if (!font) return;
    const content = font.serialize();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${font.name || "font"}.h`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseGlyph = (glyph: GfxGlyph) => {
    glyphsSignal.value = glyphsSignal.value.filter((g) => g !== glyph);
  };

  const handleSelectGlyph = (glyph: GfxGlyph) => {
    if (!glyphsSignal.value.includes(glyph)) {
      glyphsSignal.value = [...glyphsSignal.value, glyph];
    }
  };

  const font = fontSignal.value;
  const glyphs = glyphsSignal.value;

  return (
    <main class="app">
      <h1>Font editor</h1>
      <div>
        <button onClick={clickNextInput}>
          <UploadIcon />
          Upload font file
        </button>
        <input
          type="file"
          accept=".h,.txt"
          onChange={handleUpload}
          style="display: none"
        />
        <button onClick={handleDownload}>
          <DownloadIcon />
          Download font file
        </button>
      </div>
      {font && <Preview font={font} />}
      {font && <FontEditor font={font} onSelectGlyph={handleSelectGlyph} />}
      <div class="glyph-editors">
        {glyphs.map((glyph) => (
          <GlyphEditor
            key={glyph.char.value}
            glyph={glyph}
            onClose={() => handleCloseGlyph(glyph)}
          />
        ))}
      </div>
    </main>
  );
}

function clickNextInput(e: { currentTarget: HTMLElement }) {
  return e.currentTarget.nextElementSibling?.dispatchEvent(
    new Event("click", { bubbles: true }),
  );
}
