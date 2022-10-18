/**
 * @name IdentiHeart
 * @author Schlipak
 * @copyright Apache license 2015 Guillaume de Matos
 * Modified/Transpiled by ohager, 2022
 */

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // Hi-DPI / Retina
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  let ctx = canvas.getContext('2d');
  ctx?.scale(dpr, dpr);

  return canvas;
};

function hash(s: string | number) {
  return String(s)
    .split('')
    .reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
}

function isDOMElement(o: any) {
  return typeof HTMLElement === 'object'
    ? o instanceof HTMLElement
    : o && typeof o === 'object' && o.nodeType === 1 && typeof o.nodeName === 'string';
}

enum BlockType {
  ONE = 1,
  TWO,
  THREE
}

interface Position {
  x: number;
  y: number;
}

type CompositeOperation =
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosit';

/**
 * @class IdentiHeart
 * @public
 * @constructor
 * @this {IdentiHeart}
 * @param {DOM Element} c The canvas onto which the IdentiHeart is drawn
 * @param {CanvasRenderingContext2D} ctx The 2D context of the canvas
 * @param {Number} margin The margin to draw around the icon. Optional, default 5
 * @param {Number} scale The scale factor of the drawing. Optional, default 20
 * @returns {IdentiHeart} this
 */
export class IdentiHeart {
  private palette = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#795548',
    '#607D8B'
  ];

  private context: CanvasRenderingContext2D;
  private readonly cellSize: number;
  private readonly margin: number;
  private readonly scale: number;

  constructor(private canvas: HTMLCanvasElement, margin: number = 5, scale: number = 10) {
    if (typeof canvas === 'undefined') {
      throw new Error('Cannot instantiate an IdentiHeart without a target canvas.');
    }

    if (!isDOMElement(canvas)) {
      throw new Error('The target canvas must be a DOM Element.');
    }

    if (canvas.tagName !== 'CANVAS') {
      throw new Error('The target canvas must be a <canvas> element.');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create 2D context');
    }
    this.context = context;
    this.margin = margin;
    this.scale = scale;

    this.cellSize = this.canvas.width / 2 - this.margin * this.scale;
  }

  /**
   * The primary color
   * @private
   * @type {String}
   */
  private primary: string = '';

  /**
   * The accent color
   * @private
   * @type {String}
   */
  private accent: string = '';

  /**
   * The hashed username / input string
   * @private
   * @type {Number}
   */
  private hash: number = -1;

  /**
   * The generated blocks
   * @private
   * @type {Array<Block>}
   */
  private blocks: Block[] = [];

  /**
   * The generated shape
   * @private
   * @type {Shape}
   */
  private shape: Shape | null = null;

  /**
   * Makes the drawing stroked or not
   * @private
   * @type {Boolean}
   */
  private hasStroke = true;

  /**
   * The stroke weight
   * @private
   * @type {Number}
   * @default 500
   */
  private strokeWeight = 500;

  /**
   * The color of the stroke
   * @private
   * @type {String}
   * @default "#000000"
   */
  private strokeColor = '#000000';

  /**
   * The composite operation used by the renderer
   * @private
   * @type {String}
   * @default 'multiply'
   */
  private compositeOperation: CompositeOperation = 'multiply';

  /**
   * Sets the username or string to generate the drawing from
   * @public
   * @param {String} userName
   * @returns {IdentiHeart} this
   */
  setDigest(userName: string) {
    this.hash = hash(userName);
    return this;
  }

  /**
   * Sets the palette used by the renderer
   * @public
   * @optional
   * @param palette
   */
  setPalette(palette: string[]) {
    if (typeof palette !== typeof [] || palette.length === undefined) {
      throw new Error('The palette must be an array of color values.');
    }

    if (palette.length < 2) {
      throw new Error('The palette must contain at least two values.');
    }

    this.palette = palette;
    return this;
  }

  /**
   * Sets if the drawing should be stroked
   * @public
   * @param {Boolean} hasStroke The state of the stroke
   * @optional
   * @default true
   */
  setHasStroke(hasStroke: boolean) {
    this.hasStroke = hasStroke;
    return this;
  }

  /**
   * Sets the stroke weight of the drawing<br>
   * The value does not correspond to the final pixel size,
   * but is merely a multiplicative factor
   * @public
   * @param {Number} weight The weight factor of the stroke
   * @optional
   * @default 500
   */
  setStrokeWeight(weight: number) {
    this.strokeWeight = weight;
    return this;
  }

  /**
   * Sets the stroke color
   * @public
   * @param {String} color The color of the stroke
   * @optional
   * @default "#000000"
   */
  setStrokeColor(color: string) {
    this.strokeColor = color;
    return this;
  }

  /**
   * Sets the composite operation used by the renderer
   * @public
   * @param {String} operation The composite operation
   * @optional
   * @default 'multiply'
   */
  setCompositeOperation(operation: CompositeOperation) {
    this.compositeOperation = operation;
    return this;
  }

  /**
   * Updates the attached canvas<br>
   * This can be useful to render a big amount of different icons without
   * creating new instances of IdentiHeart, thus saving resources<br>
   * This function also updates the context of the canvas
   * @public
   * @optional
   * @param canvas
   */
  setCanvas(canvas: HTMLCanvasElement) {
    if (!isDOMElement(canvas)) {
      throw new Error('The parameter for the function IdentiHeart.setCanvas() must be a DOM Element.');
    }

    if (canvas.tagName !== 'CANVAS') {
      throw new Error('The parameter for the function IdentiHeart.setCanvas() must be a <canvas> element.');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create 2D context');
    }
    this.context = context;
    return this;
  }

  /**
   * The main drawing function<br>
   * Renders the IdentiHeart onto the canvas<br>
   * init() must be manually called before each render
   * @public
   * @see IdentiHeart.init()
   * @required
   * @returns {IdentiHeart} this
   */
  draw() {
    this.init();

    const c = this.canvas;
    // Rotate the canvas -45deg
    this.context.save();
    this.context.translate(c.width / 2, c.height / 2);
    this.context.rotate(-Math.PI / 4);
    this.context.translate(-c.width / 2, -c.height / 2);

    this.generateBlocks();
    this.drawBlocks();

    if (this.hasStroke) {
      this.drawOutline();
    }

    this.shape = new Shape(
      this.canvas,
      this.context,
      this.hash,
      this.primary,
      this.accent,
      {
        x: this.margin * this.scale + 1.5 * this.cellSize,
        y: this.margin * this.scale + 0.5 * this.cellSize
      },
      this.scale,
      this.cellSize,
      this.strokeColor
    );
    this.shape.draw(this.hasStroke, this.strokeWeight);

    // Restore the original matrix
    this.context.restore();

    return this;
  }

  /**
   * Initializes the IdentiHeart and clears the canvas<br>
   * Must be called before draw()
   * @public
   * @see IdentiHeart.draw()
   * @required
   * @returns {IdentiHeart} this
   */
  init() {
    this.blocks = [];
    this.shape = null;

    // Generate colors
    this.primary = this.palette[Math.abs(this.hash % this.palette.length)];
    const subHash = hash(this.hash);
    this.accent = this.palette[Math.abs(subHash % this.palette.length)];

    // Clear the canvas
    this.context.globalCompositeOperation = 'source-over';
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.globalCompositeOperation = this.compositeOperation;

    return this;
  }

  /**
   * Applies an offset to the canvas
   * @private
   */
  private offset() {
    this.context.save();
    this.context.translate(0.6 * this.scale, -0.6 * this.scale);
  }

  /**
   * Resets the offset
   * @private
   */
  private resetOffset() {
    this.context.restore();
  }

  /**
   * Draws the IdentiHeart outline
   * @private
   */
  private drawOutline() {
    this.offset();
    this.context.globalCompositeOperation = 'source-over';

    // Outer lines
    this.context.beginPath();
    this.context.moveTo(this.margin * this.scale, this.margin * this.scale);
    this.context.lineTo(this.margin * this.scale, this.canvas.height - this.margin * this.scale);
    this.context.lineTo(this.canvas.width - this.margin * this.scale, this.canvas.height - this.margin * this.scale);
    this.context.lineTo(this.canvas.width - this.margin * this.scale, this.canvas.height / 2);
    this.context.lineTo(this.canvas.width / 2, this.canvas.height / 2);
    this.context.lineTo(this.canvas.width / 2, this.margin * this.scale);
    this.context.closePath();

    this.context.strokeStyle = this.strokeColor;
    this.context.lineWidth = this.scale * (this.strokeWeight / this.canvas.width);
    this.context.lineJoin = 'round';
    this.context.lineCap = 'round';
    this.context.stroke();

    // Inner lines
    this.context.beginPath();
    this.context.moveTo(this.canvas.width / 2, this.canvas.height / 2);
    this.context.lineTo(this.margin * this.scale, this.canvas.height / 2);
    this.context.moveTo(this.canvas.width / 2, this.canvas.height / 2);
    this.context.lineTo(this.canvas.width / 2, this.canvas.height - this.margin * this.scale);

    this.context.stroke();

    this.resetOffset();
    this.context.globalCompositeOperation = this.compositeOperation;
  }

  /**
   * Generates the blocks of this IdentiHeart
   * @private
   */
  private generateBlocks() {
    let b1 = new Block(this.canvas, this.context, BlockType.ONE, this.primary, this.accent);
    b1.setHash(this.hash);
    b1.setPos({
      x: this.margin * this.scale,
      y: this.margin * this.scale
    });
    b1.setSizing(this.cellSize, this.margin, this.scale);
    this.blocks.push(b1);

    let b2 = new Block(this.canvas, this.context, BlockType.TWO, this.primary, this.accent);
    b2.setHash(this.hash);
    b2.setPos({
      x: this.margin * this.scale,
      y: this.canvas.height / 2
    });
    b2.setSizing(this.cellSize, this.margin, this.scale);
    this.blocks.push(b2);

    let b3 = new Block(this.canvas, this.context, BlockType.THREE, this.primary, this.accent);
    b3.setHash(this.hash);
    b3.setPos({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    });
    b3.setSizing(this.cellSize, this.margin, this.scale);
    this.blocks.push(b3);
  }

  /**
   * Draws the generated blocks
   * @private
   */
  private drawBlocks() {
    for (const element of this.blocks) {
      element.draw();
    }
  }
}

/**
 * @class Block
 * @private
 * @this {Block}
 * @constructor
 * @param {DOM Element} c The canvas
 * @param {CanvasRenderingContext2D} ctx The 2D context of the canvas
 * @param {BlockType} type The type of block to generate
 * @param {String} primary The primary color
 * @param {String} accent The accent color
 */
class Block {
  constructor(
    private canvas: HTMLCanvasElement,
    private context: CanvasRenderingContext2D,
    private type: BlockType,
    private primary: string,
    private accent: string
  ) {}

  /**
   * The computed cell size
   * @private
   * @type {Number}
   */
  private cellSize: number = 0;

  /**
   * The margin to put around the drawing
   * @private
   * @type {Number}
   */
  private margin: number = 0;

  /**
   * The drawing scale factor
   * @private
   * @type {Number}
   */
  private scale: number = 0;

  /**
   * The position of the block
   * @private
   * @type {Object}
   */
  private pos: Position = { x: 0, y: 0 };

  /**
   * The hashed username
   * @private
   * @type {Number}
   */
  private hash: number = -1;

  /**
   * Sets the hash to use to generate the block
   * @public
   * @required
   * @param {Number} h The hash
   */
  setHash(h: number) {
    this.hash = h;
  }

  /**
   * Sets the position of the block
   * @public
   * @required
   * @param {Position} pos The position object
   */
  setPos(pos: Position) {
    this.pos = pos;
  }

  /**
   * Sets various sizing factors
   * @public
   * @optional
   * @param {Number} cell The cell size
   * @param {Number} marg The margin
   * @param {Number} sc The scale factor
   */
  setSizing(cell: number, marg: number, sc: number) {
    this.cellSize = cell;
    this.margin = marg;
    this.scale = sc;
  }

  /**
   * Applies an offset to the drawing
   * @private
   */
  private offset() {
    this.context.save();
    this.context.translate(0.6 * this.scale, -0.6 * this.scale);
  }

  /**
   * Resets the offset
   * @private
   */
  private resetOffset() {
    this.context.restore();
  }

  /**
   * Generates a path to draw in the block
   * @private
   * @param {Number} h The hash
   * @param {Number} offset An offset to apply to the procedural generation
   */
  private makePath(h: number, offset: number) {
    const mod = Math.abs(h + offset) % 4;
    const ctx = this.context;
    switch (mod) {
      case 1:
        // right
        ctx.beginPath();
        ctx.moveTo(this.pos.x + this.cellSize, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize, this.pos.y + this.cellSize);
        ctx.lineTo(this.pos.x, this.pos.y + this.cellSize);
        ctx.closePath();
        break;
      case 2:
        // bottom
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x, this.pos.y + this.cellSize);
        ctx.lineTo(this.pos.x + this.cellSize, this.pos.y + this.cellSize);
        ctx.closePath();
        break;
      case 3:
        // left
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize, this.pos.y);
        ctx.lineTo(this.pos.x, this.pos.y + this.cellSize);
        ctx.closePath();
        break;
      case 0:
      default:
        // top
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize, this.pos.y + this.cellSize);
        ctx.closePath();
    }
  }

  /**
   * Draws the block
   * @public
   */
  draw() {
    this.offset();
    const ctx = this.context;
    if (this.type === BlockType.ONE) {
      this.makePath(this.hash, this.hash % 3);
      ctx.fillStyle = this.primary;
      ctx.fill();

      this.makePath(this.hash, this.hash % 5);
      ctx.fillStyle = this.accent;
      ctx.fill();
    } else if (this.type === BlockType.TWO) {
      this.makePath(this.hash, this.hash % 4);
      ctx.fillStyle = this.accent;
      ctx.fill();

      this.makePath(this.hash, this.hash % 3);
      ctx.fillStyle = this.primary;
      ctx.fill();
    } else {
      this.makePath(this.hash, this.hash % 7);
      ctx.fillStyle = this.accent;
      ctx.fill();

      this.makePath(this.hash, this.hash % 8);
      ctx.fillStyle = this.primary;
      ctx.fill();
    }

    this.resetOffset();
  }
}

/**
 * @class Shape
 * @private
 * @constructor
 * @this {Shape}
 * @param {DOM Element} c The canvas
 * @param {CanvasRenderingContext2D} ctx The 2D context of the canvas
 * @param {Number} hash The hash used for the generation
 * @param {String} primary The primary color
 * @param {String} accent The accent color
 * @param {Object} pos The position of the shape
 * @param {Number} scale The scale factor of the drawing
 * @param {Number} cellSize The computed cell size
 * @param {String} strokeColor The stroke color
 */
class Shape {
  constructor(
    private canvas: HTMLCanvasElement,
    private context: CanvasRenderingContext2D,
    private hash: number,
    private primary: string,
    private accent: string,
    private pos: Position,
    private scale: number,
    private cellSize: number,
    private strokeColor: string
  ) {}

  /**
   * Returns a color among the primary and accent color,
   * based on the hash
   * @private
   * @returns {String}
   */
  private getColor() {
    return [this.primary, this.accent][Math.abs(this.hash % 2)];
  }

  /**
   * Generates a path to draw the shape
   * @private
   */
  private makePath() {
    const mod = Math.abs(this.hash + 1) % 4;

    const ctx = this.context;
    switch (mod) {
      case 1:
        //circle
        ctx.beginPath();
        ctx.arc(
          this.pos.x + this.cellSize / Math.PI - 5,
          this.pos.y - this.cellSize / Math.PI + 5,
          this.cellSize / 3,
          0,
          Math.PI * 2,
          true
        );
        break;
      case 2:
        // triangle
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize * 0.65, this.pos.y);
        ctx.lineTo(this.pos.x, this.pos.y - this.cellSize * 0.65);
        ctx.closePath();
        break;
      case 3:
        // oval
        ctx.beginPath();
        ctx.moveTo(this.pos.x - this.cellSize * 0.2, this.pos.y + this.cellSize * 0.2);
        ctx.quadraticCurveTo(
          this.pos.x + this.cellSize * 0.4,
          this.pos.y,
          this.pos.x + this.cellSize * 0.5,
          this.pos.y - this.cellSize * 0.5
        );
        ctx.moveTo(this.pos.x + this.cellSize * 0.5, this.pos.y - this.cellSize * 0.5);
        ctx.quadraticCurveTo(
          this.pos.x,
          this.pos.y - this.cellSize * 0.4,
          this.pos.x - this.cellSize * 0.2,
          this.pos.y + this.cellSize * 0.2
        );
        break;
      case 0:
      default:
        // square
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize / 2, this.pos.y);
        ctx.lineTo(this.pos.x + this.cellSize / 2, this.pos.y - this.cellSize / 2);
        ctx.lineTo(this.pos.x, this.pos.y - this.cellSize / 2);
        ctx.closePath();
    }
  }

  /**
   * Draws the shape on the canvas
   * @public
   * @param  {Boolean} hasStroke The hasStroke boolean
   * @param  {Number} strokeWeight The weight of the stroke
   */
  draw(hasStroke: boolean, strokeWeight: number) {
    const color = this.getColor();
    const ctx = this.context;
    ctx.globalCompositeOperation = 'source-over';

    this.makePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.scale * (((4 / 5) * strokeWeight) / this.canvas.width);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fill();

    if (hasStroke) {
      ctx.stroke();
    }
  }
}

interface Args {
  digest: string;
  canvas?: HTMLCanvasElement;
}

export const identiheart = ({ digest, canvas }: Args) => {
  let c = canvas;
  if (!c) {
    c = createCanvas(256, 256);
  }
  new IdentiHeart(c).setDigest(digest).setStrokeWeight(100).draw();
  return c;
};
