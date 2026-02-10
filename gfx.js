// @ts-check


/**
 * @typedef {{
 *     offset: number,
 *     width: number,
 *     height: number,
 *     xAdvance: number,
 *     xOffset: number,
 *     yOffset: number
 *   }} ParsedGlyph
 */

/**
 * @typedef {{
 *   name: string,
 *   first: number,
 *   last: number,
 *   yAdvance: number,
 *   glyphs: Array<ParsedGlyph>,
 *   bitmaps: Array<number>
 * }} ParsedFont
 */

/**
 * @param {string} cCode
 * @returns {ParsedFont}
 */
export function parseFont(cCode){

    const tokens = cCode.split(/\s+/);

    const getNextToken = () => {
        let token = tokens.shift();
        if(token === '/*' || token === '/**'){
            do {
                token = tokens.shift();
            }while (token !== '*/');
            token = tokens.shift(); // waste away the */
        }
        if(token === undefined) {
            throw new Error("Unexpected end of tokens");
        }
        return token;
    }

    const expectToken = (/** @type {string[]} */ ...expected) => {
        const token = getNextToken()
        if(!expected.includes(token)) {
            throw new Error(`Expected token "${expected}", got "${token}"`);
        } else {
            return token;
        }
    }

    const expectNumber = (token = getNextToken()) => {
        const number = parseInt(token);
        if(isNaN(number)) {
            throw new Error(`Expected number, got "${token}"`);
        } else {
            return number;
        }
    }

    let name = '';
    const bitmaps = [];
    const glyphs = [];
    let first = 0;
    let last = 0;
    let yAdvance = 0;

    let token = getNextToken();
    while(tokens.length > 0) {
        if(token.endsWith('Bitmaps[]')){
            expectToken('PROGMEM');
            expectToken('=');
            expectToken('{');
            token = getNextToken();
            while(token !== '};') {

                if(token.endsWith(',')) {
                    token = token.slice(0, -1);
                }

                if(token.startsWith('0x')) {
                    bitmaps.push(parseInt(token, 16));
                }

                token = getNextToken();
            }
        } else if(token.endsWith('Glyphs[]')){
            expectToken('PROGMEM');
            expectToken('=');
            expectToken('{');
            token = getNextToken();
            while(token !== '};') {
                if(token === '{'){
                    const offset = expectNumber();
                    const width = expectNumber();
                    const height = expectNumber();
                    const xAdvance = expectNumber();
                    const xOffset = expectNumber();
                    const yOffset = expectNumber();

                    glyphs.push({
                        offset,
                        width,
                        height,
                        xAdvance,
                        xOffset,
                        yOffset
                    });

                    expectToken('}', '},');
                }
                token = getNextToken();
            }
            
            console.log('glyphs:', glyphs);
        } else if(token === 'GFXfont'){
            name = getNextToken();
            expectToken('PROGMEM');
            expectToken('=');
            expectToken('{');
            token = getNextToken();
            while(!token.endsWith('Glyphs,')){
                token = getNextToken();
            }

            first = expectNumber();
            last = expectNumber();
            yAdvance = expectNumber();
            expectToken('};');
            token = getNextToken();
        } else {
            token = getNextToken();
        }
    }

    return {
        name,
        bitmaps,
        glyphs,
        first,
        last,
        yAdvance
    }
}

export class GfxFont{
    /**
     * @param {ParsedFont} parsedFont
     */
    constructor(parsedFont){
        this._first = parsedFont.first;
        this._last = parsedFont.last;
        this.name = parsedFont.name;
        this.yAdvance = parsedFont.yAdvance;
        this.glyphs = parsedFont.glyphs.map((g, i) => new GfxGlyph(String.fromCharCode(i + parsedFont.first), parsedFont.bitmaps.slice(g.offset), g));
    }

    /**
     * @param {string} fontString
     */
    static fromString(fontString) {
        return new GfxFont(parseFont(fontString));
    }

    get first(){
        return this._first;
    }

    set first(value){
        if(value < this._first) {
            this.glyphs.unshift(...new Array(this._first - value).fill(0).map((_, i) => new GfxGlyph(String.fromCharCode(value + i))));
        } else if(value > this._first) {
            this.glyphs.splice(0, value - this._first);
        }
        this._first = value;
    }

    get last(){
        return this._last;
    }

    set last(value){
        if(value > this._last) {
            this.glyphs.push(...new Array(value - this._last).fill(0).map((_, i) => new GfxGlyph(String.fromCharCode(this._last + 1 + i))));
        } else if(value < this._last) {
            this.glyphs.splice(value - this._first + 1);
        }
        this._last = value;
    }

    /**
     * @param {number} charCode
     */
    getGlyph(charCode) {
        if(charCode >= this.first && charCode <= this.last) {
            return this.glyphs[charCode - this.first];
        }
        return null;
    }

    serialize(){
        let offset = 0;
        const glyphs = (this.glyphs.map(g => g.serialize())).map(g => ({
            width: g.width.toString(),
            height: g.height.toString(),
            bytes: g.bytes.map(b => `0x${b.toString(16).padStart(2, '0')}`),
            xAdvance: g.xAdvance.toString(),
            xOffset: g.xOffset.toString(),
            yOffset: g.yOffset.toString(),
            char: g.char,
            code: g.char.charCodeAt(0).toString(16).padStart(2, '0'),
            offset: offset += g.bytes.length, 
        }));

        const maxOffset = offset.toString().length;
        const maxWidth = Math.max(...glyphs.map(g => g.width.length));
        const maxHeight = Math.max(...glyphs.map(g => g.height.length));
        const maxXAdvance = Math.max(...glyphs.map(g => g.xAdvance.length));
        const maxXOffset = Math.max(...glyphs.map(g => g.xOffset.length));
        const maxYOffset = Math.max(...glyphs.map(g => g.yOffset.length));

        return `
const uint8_t ${this.name}Bitmaps[] PROGMEM = {
${glyphs.map(g => `  ${g.bytes.join(', ')},`).join('\n')}
};

const GFXglyph ${this.name}Glyphs[] PROGMEM = {
${glyphs.map(g => `  {  ${g.offset.toString().padStart(maxOffset, ' ')},  ${g.width.padStart(maxWidth, ' ')},  ${g.height.padStart(maxHeight, ' ')},  ${g.xAdvance.padStart(maxXAdvance, ' ')},  ${g.xOffset.padStart(maxXOffset, ' ')},  ${g.yOffset.padStart(maxYOffset, ' ')}, }, /* 0x${g.code} '${g.char}' */`).join('\n')}
};

const GFXfont ${this.name} PROGMEM = {
  (uint8_t  *)${this.name}Bitmaps,
  (GFXglyph *)${this.name}Glyphs,
  0x${this.first.toString(16)}, 0x${this.last.toString(16)}, ${this.yAdvance} };
        `;
    }
}

export class GfxGlyph {
    /**
     * @param {string} char
     * @param {number[]} [bytes]
     * @param {ParsedGlyph} [glyph]
     */
    constructor(char, bytes = [], glyph = {height: 0, width: 0, offset: 0, xAdvance: 0, xOffset: 0, yOffset: 0}) {
        this.char = char;
        this.glyph = glyph;
        /**
         * @type {boolean[][]}
         */
        this.gfx = [];
        this.parseBytes(bytes);
        this.xAdvance = glyph.xAdvance;
        this.xOffset = glyph.xOffset;
        this.yOffset = glyph.yOffset;
    }

    /**
     * @param {number[]} bytes
     */
    parseBytes(bytes){
        this.gfx = [];
        let pix = 0;
        let byte = 0;
        let j = -1;
        for(let y=0; y<this.glyph.height; y++) {
            const row = [];
            for(let x = 0; x < this.glyph.width;x++) {
                if(j < 0){
                    j=7;
                    byte = bytes[pix++];
                }
                const ink = ((byte >> j) & 1) ? true : false;
                
                row.push(ink);
                j--;
            }
                
            this.gfx.push(row);
        }
    }

    getBytes(){
        return toBytes(this.gfx.flat());
    }

    get width(){
        return this.glyph.width;
    }
    set width(value){
        if(value < 0) {
            throw new Error("Width must be a positive number");
        }

        if(value < this.glyph.width) {
            // If reducing width, we need to trim the gfx array
            for(let y = 0; y < this.glyph.height; y++) {
                this.gfx[y].splice(value);
            }
        } else if(value > this.glyph.width) {
            // If increasing width, we need to pad the gfx array
            for(let y = 0; y < this.glyph.height; y++) {
                while(this.gfx[y].length < value) {
                    this.gfx[y].push(false);
                }
            }
        }

        this.glyph.width = value;
    }

    get height(){
        return this.glyph.height;
    }
    
    set height(value){
        if(value < 0) {
            throw new Error("Height must be a positive number");
        }

        if(value < this.glyph.height) {
            // If reducing height, we need to trim the gfx array
            this.gfx.splice(value);
        } else if(value > this.glyph.height) {
            // If increasing height, we need to pad the gfx array
            while(this.gfx.length < value) {
                this.gfx.push(new Array(this.glyph.width).fill(false));
            }
        }

        this.glyph.height = value;
    }
    
    /**
     * @param {number} x
     * @param {number} y
     */
    getPixel(x, y) {
        if(x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;
        }
        return this.gfx[y][x];
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} value
     */
    setPixel(x, y, value) {
        if(x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.gfx[y][x] = value;
    }

    serialize(){
        return {
            bytes: this.getBytes(),
            width: this.width,
            height: this.height,
            xAdvance: this.xAdvance,
            xOffset: this.xOffset,
            yOffset: this.yOffset,
            char: this.char
        };
    }
}

/**
 * @param {boolean[]} bits
 */
function toBytes(bits){
    const bytes = [];
    for(let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for(let j = 0; j < 8; j++) {
            byte |= (bits[i + j] ? 1 : 0) << (7 - j);
        }
        bytes.push(byte);
    }
    return bytes;
}
