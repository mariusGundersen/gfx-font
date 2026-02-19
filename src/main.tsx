import { render } from "preact";
import { App } from "./App";
import { GfxFont } from "./gfx";

async function main() {
  const font = GfxFont.fromString(
    await fetch("./fonts/test.h").then((r) => r.text()),
  );
  render(<App initialFont={font} />, document.body);
}

main();
