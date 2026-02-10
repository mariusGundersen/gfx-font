// @ts-check

// @ts-ignore
import { html, Component, render } from 'https://unpkg.com/htm/preact/standalone.module.js';
import { GfxFont, GfxGlyph } from './gfx.js';

/**
 * @interface Component
 */

class RefreshComponent extends Component {
    state = {refresh: 0};
    /**
     * @param {any} value
     */
    setState(value){
        super.setState(value);
    }
    /**
     * @param {Function} callback
     */
    refresh(callback){
        return (/** @type {any} */ ...args) => {
            callback?.(...args);
            this.setState({refresh: this.state.refresh + 1});
        }
    }
}

class App extends RefreshComponent {
    /**
     * @param {{ 
     *      font: GfxFont; 
     * }} props
     * @param {{
     *      glyph: GfxGlyph | null;
     * }} state
     */
    render({ font }, {glyph}) {
        return html`
            <main class="app">                
                <h1>${font?.name ?? 'Untitled Font'}</h1>
                <div>
                    <button onClick=${() => console.log(font?.serialize())}>Download</button>
                </div>
                <${FontEditor} font=${font} onSelectGlyph=${(/** @type {GfxGlyph} */ glyph) => this.setState({glyph})} />
                <${GlyphEditor} glyph=${glyph} />
            </main>
        `;
    }
}

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
                    <span>First character</span>
                    <input
                        type="number"
                        name="first-char"
                        value=${props.font.first}
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { props.font.first = e.target.valueAsNumber; })}
                        min="1"
                        max="255" />
                </label>
                <label>
                    <span>Last character</span>
                    <input
                        type="number"
                        name="last-char"
                        value=${props.font.last}
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { props.font.last = e.target.valueAsNumber; })}
                        min="1"
                        max="255" />
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
    render(props, state){
        return html`
            <table id="characters">
                <tr>
                    <th></th>
                    ${
                        new Array(16).fill(0).map((_, i) => html`<th>${`_${i.toString(16)}`}</th>`)
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

class GlyphEditor extends RefreshComponent {
    /**
     * @param {{ glyph: GfxGlyph }} props
     * @param {any} state
     */
    render({glyph}, state){
        return html`
            <fieldset>
                <legend>Glyph Editor</legend>
                
                <label>
                    <span>Width</span>
                    <input 
                        type="number" 
                        name="width"
                        value=${glyph?.width ?? 8}
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.width = e.target.valueAsNumber; })} 
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
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.height = e.target.valueAsNumber; })} 
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
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.xOffset = e.target.valueAsNumber; })} 
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
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.yOffset = e.target.valueAsNumber; })} 
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
                        onChange=${this.refresh((/** @type {{ target: { valueAsNumber: number; }; }} */ e) => { glyph.xAdvance = e.target.valueAsNumber; })} 
                        min="0"
                        max="255"
                    />
                </label>
                <${GlyphTable} glyph=${glyph} />
            </fieldset>
        `;
    }
}

class GlyphTable extends RefreshComponent {
    /**
     * @param {{ glyph: GfxGlyph }} props
     * @param {any} state
     */
    render({glyph}, state){
        return html`
            <table id="glyph">
                ${glyph?.gfx.map((r, y) => html`
                    <tr>
                        ${r.map((c, x) => html`
                            <td>
                                <input type="checkbox" checked=${c ? 'checked' : ''} onChange=${this.refresh((/** @type {{ target: { checked: boolean; }; }} */ e) => { glyph.setPixel(x, y, e.target.checked); })} />
                            </td>
                        `)}
                    </tr>
                `)}
            </table>
        `
    }
}

const font = GfxFont.fromString(await fetch('./fonts/test.h').then(r => r.text()));

render(html`<${App} font=${font} />`, document.body);