import { useSignal } from "@preact/signals";
import { FontEditor } from "./FontEditor";
import { gfxFontFromString } from "./gfx";
import { GfxFont } from "./GfxFont";
import { GfxGlyph } from "./GfxGlyph";
import { GlyphEditor } from "./GlyphEditor";
import { DownloadIcon, LoadIcon, UploadIcon } from "./icons";
import LoadFonts from "./LoadFont";
import { Preview } from "./Preview";

export function App({ initialFont }: { initialFont?: GfxFont }) {
  const fontSignal = useSignal(initialFont);
  const glyphsSignal = useSignal<GfxGlyph[]>([]);

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
      <LoadFonts onSelect={(font) => (fontSignal.value = font)} />
      <h1>Font editor</h1>
      <div>
        <button commandfor="load-popover" command="show-modal">
          <LoadIcon />
          Load
        </button>
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
        <button onClick={handleDownload} disabled={!fontSignal.value}>
          <DownloadIcon />
          Download font file
        </button>
      </div>
      {font && <FontEditor font={font} onSelectGlyph={handleSelectGlyph} />}
      <div class="glyph-editors">
        {glyphs.map((glyph) => (
          <GlyphEditor
            key={glyph.char}
            glyph={glyph}
            onClose={() => handleCloseGlyph(glyph)}
            copyFrom={(source) =>
              glyph.copyFrom(font!.getGlyph(source)!.serialize())
            }
          />
        ))}
      </div>
      {font && <Preview font={font} />}
    </main>
  );
}

function clickNextInput(e: { currentTarget: HTMLElement }) {
  return (e.currentTarget.nextElementSibling as HTMLInputElement).click();
}
