import { render } from "preact";
import { App } from "./App";
import { gfxFontFromString } from "./gfx";

async function main() {
  const font = gfxFontFromString(
    await fetch("./fonts/test.h").then((r) => r.text()),
  );
}

main();

render(<App />, document.body);
