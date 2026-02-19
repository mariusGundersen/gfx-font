import { useState } from "preact/hooks";
import { FontEditor } from "./FontEditor";
import { GfxFont, GfxGlyph } from "./gfx";
import { GlyphEditor } from "./GlyphEditor";
import { Preview } from "./Preview";

export function App({ initialFont }: { initialFont: GfxFont | null }) {
  const [font, setFont] = useState<GfxFont | null>(initialFont);
  const [glyphs, setGlyphs] = useState<GfxGlyph[]>([]);
  const [previewRefresh, setPreviewRefresh] = useState(0);

  const handleUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setFont(GfxFont.fromString(text));
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
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
    setGlyphs(glyphs.filter((g) => g !== glyph));
  };

  const handleSelectGlyph = (glyph: GfxGlyph) => {
    if (!glyphs.includes(glyph)) {
      setGlyphs([...glyphs, glyph]);
    }
  };

  const refreshPreview = () => {
    setPreviewRefresh((prev) => prev + 1);
  };

  return (
    <main class="app">
      <h1>Font editor</h1>
      <div>
        <button
          onClick={(e) =>
            (e.target as HTMLElement).nextElementSibling?.dispatchEvent(
              new Event("click", { bubbles: true }),
            )
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload font file
        </button>
        <input
          type="file"
          accept=".h,.txt"
          onChange={handleUpload}
          style="display: none"
        />
        <button onClick={handleDownload}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download font file
        </button>
      </div>
      {font && <Preview font={font} refreshKey={previewRefresh} />}
      {font && <FontEditor font={font} onSelectGlyph={handleSelectGlyph} />}
      <div class="glyph-editors">
        {glyphs.map((glyph) => (
          <GlyphEditor
            key={glyph.char}
            glyph={glyph}
            onClose={() => handleCloseGlyph(glyph)}
            onChange={refreshPreview}
          />
        ))}
      </div>
    </main>
  );
}
