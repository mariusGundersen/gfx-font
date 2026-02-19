// @ts-check

import { Component, html, render } from 'https://unpkg.com/htm/preact/standalone.module.js';
import { GfxFont, GfxGlyph } from './gfx.js';

/**
 * @interface Component
 * 
 */

/**
 * @template {{}} P
 * @template {{}} S
 * @extends {Component<P, S & {refresh?: number}>}
 * @abstract
 */
class RefreshComponent extends Component {
    /**
     * @param {Function} callback
     */
    refresh(callback) {
        return (/** @type {any} */ ...args) => {
            callback?.(...args);
            this.setState({ refresh: (this.state.refresh || 0) + 1 });
        }
    }
}

/**
 * @extends {RefreshComponent<{font: GfxFont}, {font: GfxFont | null, glyphs: GfxGlyph[]}>}
 */
class App extends RefreshComponent {

    /**
     * @param {{ font: GfxFont; } | undefined} props
     */
    constructor(props) {
        super(props);
        this.setState({ font: props?.font ?? null, glyphs: [] });
    }

    handleUpload = (/** @type {{ target: { files: FileList; }; }} */ e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                this.setState({ font: GfxFont.fromString(text) });
            }
        };
        reader.readAsText(file);
    }

    handleDownload = () => {
        if (!this.state.font) return;
        const content = this.state.font.serialize();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.state.font.name || 'font'}.h`;
        a.click();
        URL.revokeObjectURL(url);
    };

    handleCloseGlyph = (/** @type {GfxGlyph} */ glyph) => {
        this.setState({ glyphs: this.state.glyphs.filter(g => g !== glyph) });
    }

    refreshPreview = () => {
        this.setState({ previewRefresh: (this.state.previewRefresh || 0) + 1 });
    }

    /**
     * @param {{ 
     *      font: GfxFont; 
     * }} _
     * @param {{
     *      font: GfxFont | null
     *      glyphs: GfxGlyph[];
     * } | undefined} state
     */
    render(_, state) {
        const font = state?.font;
        const glyphs = state?.glyphs ?? [];
        return html`
            <main class="app">                
                <h1>Font editor</h1>
                <div>
                    <button onClick=${(e) => e.currentTarget.nextElementSibling.click()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Upload font file
                    </button>
                    <input type="file" accept=".h,.txt" onChange=${this.handleUpload} style="display:none" />
                    <button onClick=${this.handleDownload}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download font file
                    </button>
                </div>
                <${Preview} font=${font} refreshKey=${state?.previewRefresh} />
                <${FontEditor} font=${font} onSelectGlyph=${(/** @type {GfxGlyph} */ glyph) => this.setState({ glyphs: [...(this.state.glyphs ?? []), glyph].filter((g, i, e) => e.indexOf(g) === i) })} />
                <div class="glyph-editors">
                    ${glyphs.map(glyph => html`<${GlyphEditor} key=${glyph.char} glyph=${glyph} onClose=${() => this.handleCloseGlyph(glyph)} onChange=${this.refreshPreview} />`)}
                </div>
            </main>
        `;
    }
}

/**
 * @extends {RefreshComponent<{font: GfxFont, onSelectGlyph(glyph: GfxGlyph): void }, any>}
 */
class FontEditor extends RefreshComponent {
    /**
     * @param {{ 
     *      font: GfxFont; 
     *      onSelectGlyph(glyph: GfxGlyph): void
     * }} props
     */
    render(props) {
        return html`
            <fieldset>
                <legend>Font Settings</legend>
                <label>
                    <span>Name</span>
                    <input
                        type="text"
                        name="name"
                        value=${props.font.name}
                        onChange=${this.refresh((/** @type {{ target: { value: string; }; }} */ e) => { props.font.name = e.target.value; })}
                    />
                </label>
                <label>
                    <span>First character</span>
                    <input
                        type="number"
                        name="first-char"
                        value=${props.font.first}
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { props.font.first = e.target.valueAsNumber; })}
                        min="1"
                        max="255" 
                    />
                </label>
                <label>
                    <span>Last character</span>
                    <input
                        type="number"
                        name="last-char"
                        value=${props.font.last}
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { props.font.last = e.target.valueAsNumber; })}
                        min="1"
                        max="255" 
                    />
                </label>
                <${CharacterTable} font=${props.font} onSelectGlyph=${(/** @type {GfxGlyph} */ glyph) => props.onSelectGlyph(glyph)} />
            </fieldset>
        `;
    }
}

class CharacterTable extends Component {
    /**
     * @param {{ font: GfxFont; onSelectGlyph: (glyph: GfxGlyph) => void; }} props
     * @param {any} state
     */
    render(props, state) {
        return html`
            <table id="characters">
                <tr>
                    <th></th>
                    ${new Array(16).fill(0).map((_, i) => html`<th>${`_${i.toString(16)}`}</th>`)
            }
                </tr>
                ${new Array(16).fill(0).map((_, i) => html`
                    <tr>
                        <th>${`${i.toString(16)}_`}</th>
                        ${new Array(16).fill(0)
                    .map((_, j) => props.font.getGlyph(i * 16 + j))
                    .map((glyph) => html`
                                <td 
                                    onClick=${glyph && (() => props.onSelectGlyph(glyph))} 
                                    style=${{ background: glyph ? glyph.width === 0 || glyph.height === 0 ? '#ccc' : '#cec' : '#ecc' }}
                                >
                                    ${glyph?.char ?? ''}
                                </td>
                            `)
                }
                    </tr>
                `)}
            </table>
        `
    }
}

/**
 * @extends {RefreshComponent<{glyph: GfxGlyph, onClose?: () => void, onChange?: () => void }, any>}
 */
class GlyphEditor extends RefreshComponent {
    /**
     * @param {{ glyph: GfxGlyph, onClose?: () => void, onChange?: () => void }} props
     * @param {any} state
     */
    render({ glyph, onClose, onChange }, state) {
        const refreshAndNotify = (/** @type {Function} */callback) => this.refresh((/** @type {any} */ ...args) => {
            callback(...args);
            onChange?.();
        });
        return html`
            <fieldset>
                <legend>
                    Glyph Editor
                    <button class="close-btn" onClick=${onClose}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </legend>
                
                <label>
                    <span>Width</span>
                    <input 
                        type="number" 
                        name="width"
                        value=${glyph?.width ?? 8}
                        onChange=${refreshAndNotify((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.width = e.target.valueAsNumber; })} 
                        min="1"
                        max="255"
                    />
                </label>
                <label>
                    <span>Height</span>
                    <input 
                        type="number" 
                        name="height"
                        value=${glyph?.height ?? 8}
                        onChange=${refreshAndNotify((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.height = e.target.valueAsNumber; })}
                        min="1"
                        max="255"
                    />
                </label>
                <label>
                    <span>X offset</span>
                    <input 
                        type="number" 
                        name="x-offset"
                        value=${glyph?.xOffset ?? 0}
                        onChange=${refreshAndNotify((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.xOffset = e.target.valueAsNumber; })} 
                        min="-255"
                        max="255"
                    />
                </label>
                <label>
                    <span>Y offset</span>
                    <input 
                        type="number" 
                        name="y-offset"
                        value=${glyph?.yOffset ?? 0}
                        onChange=${refreshAndNotify((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.yOffset = e.target.valueAsNumber; })} 
                        min="-255"
                        max="255"
                    />
                </label>
                <label>
                    <span>X Advance</span>
                    <input 
                        type="number" 
                        name="x-advance"
                        value=${glyph?.xAdvance ?? 8}
                        onChange=${refreshAndNotify((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.xAdvance = e.target.valueAsNumber; })}
                        min="0"
                        max="255"
                    />
                </label>
                <${GlyphTable} glyph=${glyph} onChange=${onChange} />
            </fieldset>
        `;
    }
}

/**
 * @extends {RefreshComponent<{glyph: GfxGlyph, onChange?: () => void }, any>}
 */
class GlyphTable extends RefreshComponent {
    /**
     * @param {{ glyph: GfxGlyph, onChange?: () => void }} props
     * @param {any} state
     */
    render({ glyph, onChange }, state) {
        const refreshAndNotify = (/** @type {Function} */callback) => this.refresh((/** @type {any} */ ...args) => {
            callback(...args);
            onChange?.();
        });
        return html`
            <table id="glyph">
                ${glyph?.gfx.map((r, y) => html`
                    <tr>
                        ${r.map((c, x) => html`
                            <td>
                                <input 
                                    type="checkbox" 
                                    checked=${c ? 'checked' : ''} 
                                    onChange=${refreshAndNotify((/** @type {{ target: { checked: boolean; }; }} */ e) => { glyph.setPixel(x, y, e.target.checked); })}
                                    onMouseLeave=${refreshAndNotify((/** @type {{ target: { checked: boolean }; buttons: number }} */ e) => { e.buttons && glyph.setPixel(x, y, !e.target.checked); })}
                                />
                            </td>
                        `)}
                    </tr>
                `)}
            </table>
        `
    }
}

class Preview extends RefreshComponent {
    /**
     * @param {{ font: GfxFont | null | undefined, refreshKey?: number }} props
     */
    render({ font, refreshKey }) {
        if (!font) return null;

        const renderCanvas = (/** @type {HTMLCanvasElement} */ canvas) => {
            if (!canvas || !font) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const padding = 10;
            const scale = 2;

            const text = this.state?.previewText || 'The quick brown fox jumps over the lazy dog';
            const fontHeight = font.yAdvance;
            const lines = text.split('\n');
            const maxWidth = Math.max(...lines.map(line => {
                let width = 0;
                for (let char = 0; char < line.length; char++) {
                    const glyph = font.getGlyph(line.charCodeAt(char));
                    width += glyph?.xAdvance || 0;
                }
                return width;
            }));

            canvas.width = (maxWidth + padding * 2) * scale;
            canvas.height = (lines.length * (fontHeight) + padding * 2) * scale;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';

            ctx.scale(scale, scale);
            let y = fontHeight;
            for (const line of lines) {
                let x = padding;
                for (let char = 0; char < line.length; char++) {
                    const glyph = font.getGlyph(line.charCodeAt(char));
                    if (glyph) {
                        for (let gy = 0; gy < glyph.height; gy++) {
                            for (let gx = 0; gx < glyph.width; gx++) {
                                if (glyph.gfx[gy]?.[gx]) {
                                    ctx.fillRect(x + gx + glyph.xOffset, y + gy + glyph.yOffset, 1, 1);
                                }
                            }
                        }
                    }
                    x += glyph?.xAdvance || 0;
                }
                y += fontHeight;
            }
        };

        const handleInput = (/** @type {{ target: { value: string; }; }} */ e) => {
            this.setState({ previewText: e.target.value });
            setTimeout(() => {
                const canvas = document.querySelector('fieldset:nth-of-type(2) canvas');
                if (canvas) renderCanvas(/** @type {HTMLCanvasElement} */(canvas));
            }, 0);
        };

        return html`
            <fieldset>
                <legend>Preview</legend>
                <textarea 
                    rows="3"
                    onInput=${handleInput}
                >The quick brown fox jumps over the lazy dog</textarea>
                <canvas key=${refreshKey} ref=${renderCanvas}></canvas>
            </fieldset>
        `;
    }
}

const font = GfxFont.fromString(await fetch('./fonts/test.h').then(r => r.text()));

render(html`<${App} font=${font} />`, document.body);