import { NO_DATA_FOUND_RESPONSE } from '../../core/error-reporting';
import { GrMLFunction } from '../../core/function';
import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLProperties } from '../../core/properties';
import { HasBlockRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation } from '../../core/representation';
import { GrMLType } from '../../core/types';
import { pipelineComponent } from '../../models/pipeline';
import * as tf from '@tensorflow/tfjs';

export enum DRAW_MODE {
  IDLE = 0,
  DRAWING = 1,
  ERASING = 2,
}


class GrMLMnistDrawBlock extends GrMLBlock {
  public static TAG_NAME = 'grml-mnist-draw';
  public ctx: CanvasRenderingContext2D | null;
  private mode: DRAW_MODE = DRAW_MODE.IDLE;

  private canvas;

  constructor (parent: GrMLFunction) {
    super(parent);
    this.canvas = document.createElement('canvas');

    this.shadowRoot?.querySelector('.core')?.appendChild(this.canvas);
    this.canvas.height = 28 * 2;
    this.canvas.width = 28 * 2;
    this.canvas.style.background = '#000000';
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
  }

  private handleMouseDown (e: MouseEvent) {
    this.mode = e.button === 2 ? DRAW_MODE.ERASING : DRAW_MODE.DRAWING;
  }

  private handleMouseUp () {
    this.mode = DRAW_MODE.IDLE;
  }

  private handleMouseMove (e: MouseEvent) {
    if (this.mode === DRAW_MODE.IDLE) {
      return;
    }

    if (!this.ctx) {
      return;
    }

    const { x: bbx, y: bby } = this.canvas.getBoundingClientRect();

    const x = e.clientX - bbx;
    const y = e.clientY - bby;
    if (this.mode === DRAW_MODE.ERASING) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(x - 3, y - 3, 7, 7);
    } else {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(x - 1, y - 1, 3, 3);
    }
  }

}

@pipelineComponent('MNIST', 0)
export class GrMLMnistDrawFunction extends GrMLFunction implements HasBlockRepresentation {

  public static readonly Block = GrMLMnistDrawBlock;

  // TODO: CodeSnippet

  public static NAME = 'grml-mnist-draw';
  public static VERBOSE_NAME = 'MNIST Drawing';
  public static ICON_SRC = 'img/icons/mnist.svg';

  public representations: VariousRepresentations & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLMnistDrawFunction.Block(this),
    // [REPRESENTATION_TYPES.CODE]: new MnistDrawFunction.CodeSnippet(this),
  };

  public properties: GrMLProperties = {};

  constructor () {
    super(GrMLMnistDrawFunction.VERBOSE_NAME, 0, 1);

    this.returnValues[0].name = 'Data';
    this.returnValues[0].type = new GrMLType.Tensor([ 28, 28, 1 ]);


  }

  // FIXME
  public data () {
    // TODO: Flo fix data method of draw function

    return;

    /* const ctx: CanvasRenderingContext2D | null = (<GrMLMnistDrawBlock> this.representations[REPRESENTATION_TYPES.BLOCK]).ctx;
    const pixels = ctx?.getImageData(0, 0, ctx?.canvas.width, ctx?.canvas.height).data;
    if (pixels) {
      const greyscaleValues: number[] = [ ];
      for (let i = 0; i < pixels.length; i += 8) {
        greyscaleValues.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
        if ((i % (8 * 28)) === 0) {
          i += 8 * 28;
          continue;
        }
      }
      return Promise.resolve([ tf.tensor(greyscaleValues, [ 28, 28, 1 ]) ]);
    } else {
      return Promise.reject(NO_DATA_FOUND_RESPONSE);
    } */
  }

}
