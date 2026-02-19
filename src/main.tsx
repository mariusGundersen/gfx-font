import { render } from 'preact';
import { App } from './App';
import { gfxFontFromString } from './gfx';

async function main() {
  const font = gfxFontFromString(
    await fetch('./fonts/test.h').then((r) => r.text())
  );
  render(<App initialFont={font} />, document.body);
}

main();
