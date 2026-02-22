import { ReadonlySignal, useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { gfxFontFromString, toHex } from "./gfx";
import { GfxFont } from "./GfxFont";
import * as style from "./LoadFont.module.css";
import { PreviewCanvas } from "./Preview";

const fonts = [
  "FreeMono9pt7b.h",
  "FreeMono12pt7b.h",
  "FreeMono18pt7b.h",
  "FreeMono24pt7b.h",
  "FreeMonoBold9pt7b.h",
  "FreeMonoBold12pt7b.h",
  "FreeMonoBold18pt7b.h",
  "FreeMonoBold24pt7b.h",
  "FreeMonoBoldOblique9pt7b.h",
  "FreeMonoBoldOblique12pt7b.h",
  "FreeMonoBoldOblique18pt7b.h",
  "FreeMonoBoldOblique24pt7b.h",
  "FreeMonoOblique9pt7b.h",
  "FreeMonoOblique12pt7b.h",
  "FreeMonoOblique18pt7b.h",
  "FreeMonoOblique24pt7b.h",
  "FreeSans9pt7b.h",
  "FreeSans12pt7b.h",
  "FreeSans18pt7b.h",
  "FreeSans24pt7b.h",
  "FreeSansBold9pt7b.h",
  "FreeSansBold12pt7b.h",
  "FreeSansBold18pt7b.h",
  "FreeSansBold24pt7b.h",
  "FreeSansBoldOblique9pt7b.h",
  "FreeSansBoldOblique12pt7b.h",
  "FreeSansBoldOblique18pt7b.h",
  "FreeSansBoldOblique24pt7b.h",
  "FreeSansOblique9pt7b.h",
  "FreeSansOblique12pt7b.h",
  "FreeSansOblique18pt7b.h",
  "FreeSansOblique24pt7b.h",
  "FreeSerif9pt7b.h",
  "FreeSerif12pt7b.h",
  "FreeSerif18pt7b.h",
  "FreeSerif24pt7b.h",
  "FreeSerifBold9pt7b.h",
  "FreeSerifBold12pt7b.h",
  "FreeSerifBold18pt7b.h",
  "FreeSerifBold24pt7b.h",
  "FreeSerifBoldItalic9pt7b.h",
  "FreeSerifBoldItalic12pt7b.h",
  "FreeSerifBoldItalic18pt7b.h",
  "FreeSerifBoldItalic24pt7b.h",
  "FreeSerifItalic9pt7b.h",
  "FreeSerifItalic12pt7b.h",
  "FreeSerifItalic18pt7b.h",
  "FreeSerifItalic24pt7b.h",
  "Org_01.h",
  "Picopixel.h",
  "Tiny3x3a2pt7b.h",
  "TomThumb.h",
];

export default function LoadFonts({
  onSelect,
}: {
  onSelect?: (font: InstanceType<typeof GfxFont>) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <dialog id="load-popover" ref={dialogRef}>
      <FontList
        onSelect={(font) => {
          dialogRef.current?.close();
          onSelect?.(font);
        }}
      />
    </dialog>
  );
}

function FontList({
  onSelect,
}: {
  onSelect?: (font: InstanceType<typeof GfxFont>) => void;
}) {
  const previewText = useSignal("Preview");
  const scale = useSignal(1);
  return (
    <>
      <table class={style.fontList}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Range</th>
            <th>Preview</th>
          </tr>

          <tr>
            <td></td>
            <td></td>
            <td>
              <input
                type="text"
                placeholder="Preview text"
                value={previewText.value}
                onInput={(e) => (previewText.value = e.currentTarget.value)}
              />
              <select
                value={scale.value}
                onInput={(e) => (scale.value = parseInt(e.currentTarget.value))}
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
              </select>
            </td>
          </tr>
        </thead>
        <tbody>
          {fonts.map((font) => (
            <FontItem
              name={font}
              onSelect={onSelect}
              previewText={previewText}
              scale={scale}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

function FontItem({
  name,
  onSelect,
  previewText,
  scale,
}: {
  name: string;
  onSelect?: (font: InstanceType<typeof GfxFont>) => void;
  previewText?: ReadonlySignal<string>;
  scale?: ReadonlySignal<number>;
}) {
  return (
    <FontPreview
      name={name}
      onSelect={onSelect}
      previewText={previewText}
      scale={scale}
    />
  );
}

type Pending<T> =
  | { status: "pending"; promise: Promise<T> }
  | { status: "resolved"; result: T }
  | { status: "rejected"; error: any };

const previews = new Map<string, Pending<any>>();

function use<T>(name: string, factory: (name: string) => Promise<T>): T {
  const preview = previews.get(name);
  if (preview) {
    switch (preview.status) {
      case "pending":
        throw preview.promise;
      case "resolved":
        return preview.result;
      case "rejected":
        throw preview.error;
    }
  } else {
    const promise = factory(name).then(
      (result) => {
        previews.set(name, { status: "resolved", result });
        return result;
      },
      (error) => {
        previews.set(name, { status: "rejected", error });
        throw error;
      },
    );
    previews.set(name, { status: "pending", promise });
    throw promise;
  }
}

const fetchFont = (name: string) =>
  fetch(
    `https://raw.githubusercontent.com/adafruit/Adafruit-GFX-Library/refs/heads/master/Fonts/${name}`,
  )
    .then((r) => r.text())
    .then((c) => gfxFontFromString(c));

function FontPreview({
  name,
  onSelect,
  previewText,
  scale,
}: {
  name: string;
  onSelect?: (font: InstanceType<typeof GfxFont>) => void;
  previewText?: ReadonlySignal<string>;
  scale?: ReadonlySignal<number>;
}) {
  const [font, setFont] = useState<InstanceType<typeof GfxFont>>();

  useEffect(() => {
    fetchFont(name).then((font) => setFont(font));
  }, [name]);

  return font ? (
    <tr onClick={() => onSelect?.(font)}>
      <th>{name.slice(0, -2)}</th>
      <td>
        <code>{toHex(font.first.value)}</code> -{" "}
        <code>{toHex(font.last.value)}</code>
      </td>
      <td>
        <PreviewCanvas
          font={font}
          previewText={previewText?.value ?? "Preview"}
          scale={scale?.value ?? 1}
          padding={1}
          fgColor="black"
          bgColor="transparent"
        />
      </td>
    </tr>
  ) : (
    <tr>
      <th>{name.slice(0, -2)}</th>
      <td>
        <code>Loading...</code>
      </td>
      <td></td>
    </tr>
  );
}
