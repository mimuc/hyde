import { GrMLBlock } from '../core/graphical/blocks';
import { GrMLProperties, GrMLPropertyType } from '../core/properties';
import { COULD_NOT_LOAD_IMAGE_DATA } from '../core/error-reporting';
import { GrMLType } from '../core/types';
import * as tf from '@tensorflow/tfjs';
import { GrMLFunction } from '../core/function';

function collectImageData (img: HTMLImageElement | ImageBitmap): tf.Tensor | null {
  if (!img) {
    return null;
  }
  return tf.browser.fromPixels(img);
}

function bmpToDataUrl (img: ImageBitmap): string {
  const canvas = <HTMLCanvasElement>document.createElement('canvas');
  canvas.height = img.height;
  canvas.width = img.width;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0);
  return canvas.toDataURL();
}

export class GrMLImageLoaderBlock extends GrMLBlock {
  public static TAG_NAME = 'grml-image-loader-block';
  public static DISPLAY_NAME = 'Image from URL';
  public static readonly DESCRIPTION = 'Loads a single image from a URL and provides it as tensor';

  public properties: GrMLProperties = {
    path: {
      label: 'Image URL',
      type: GrMLPropertyType.URL,
      value: '',
    }
  };

  private image: HTMLImageElement | null = null;

  constructor (parent: GrMLFunction) {
    super(parent);
    // TODO Move to function
    this.parent.returnValues[0].type = new GrMLType.Tensor();
  }

  public async data (): Promise<any[]> {

    const imageUrl = this.properties['path'].value;

    if (imageUrl) {
      if (!this.image || this.image.src !== imageUrl) {
        return new Promise((resolve, reject) => {
          this.image = new Image();
          const blockContentWrapper = this.shadowRoot?.querySelector('.block-content .core');
          this.image.addEventListener('error', () => {
            if (blockContentWrapper && this.image) {
              blockContentWrapper.innerHTML = '';
            }
            this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
            reject([ COULD_NOT_LOAD_IMAGE_DATA ]);
          });
          this.image.addEventListener('load', () => {
            if (!this.image) {
              this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
              return reject([ COULD_NOT_LOAD_IMAGE_DATA ]);
            }
            if (blockContentWrapper) {
              blockContentWrapper.innerHTML = '';
              blockContentWrapper.appendChild(this.image);
            }
            const tensor = collectImageData(this.image);

            if (tensor) {
              this.parent.returnValues[0].type = new GrMLType.Tensor(tensor.shape);
              this.parent.removeWarning(COULD_NOT_LOAD_IMAGE_DATA);
              resolve([ tensor ]);
            } else {
              this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
              reject([ COULD_NOT_LOAD_IMAGE_DATA ]);
            }
          });
          this.image.src = imageUrl;
        });
      } else {
        const imageData = collectImageData(this.image);
        if (imageData) {
          this.parent.returnValues[0].type = new GrMLType.Tensor(imageData.shape);
          this.parent.removeWarning(COULD_NOT_LOAD_IMAGE_DATA);
          return Promise.resolve([ imageData ]);
        } else {
          return Promise.reject(COULD_NOT_LOAD_IMAGE_DATA);
        }
      }
    }
    this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
    return Promise.reject([ COULD_NOT_LOAD_IMAGE_DATA ]);
  }
}

// @pipelineComponent('Image')
export class GrMLImageFileBlock extends GrMLBlock {
  public static TAG_NAME = 'grml-image-file-block';
  public static DISPLAY_NAME = 'Image from file';
  public static readonly DESCRIPTION = 'Loads a single image from a file and provides it as tensor';
  public properties: GrMLProperties = {
    file: {
      label: 'Image File',
      type: GrMLPropertyType.FILE,
      onChange: () => this.showThumbnail(),
    }
  };

  constructor (parent: GrMLFunction) {
    super(parent);
    this.parent.returnValues[0].type = new GrMLType.Tensor();
  }

  public async data (): Promise<any[]> {
    if (this.properties['file'].value) {
      const file = <File> this.properties['file'].value;
      return createImageBitmap(file)
        .then((bmp) => {
          const tensor = collectImageData(bmp);
          if (tensor) {
            this.parent.returnValues[0].type = new GrMLType.Tensor(tensor.shape);
            this.parent.removeWarning(COULD_NOT_LOAD_IMAGE_DATA);
            return [ tensor ];
          } else {
            this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
            return [ COULD_NOT_LOAD_IMAGE_DATA ];
          }
        })
        .catch(() => {
          this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
          return [ COULD_NOT_LOAD_IMAGE_DATA ];
        });
    } else {
      this.parent.addWarning(COULD_NOT_LOAD_IMAGE_DATA);
      return [ COULD_NOT_LOAD_IMAGE_DATA ];
    }
  }


  private showThumbnail () {
    if (this.properties['file'].value) {
      const file = <File> this.properties['file'].value;
      createImageBitmap(file)
        .then((bmp) => {
          const dataUrl = bmpToDataUrl(bmp);
          const img = new Image();
          img.src = dataUrl;
          const blockContentWrapper = this.shadowRoot?.querySelector('.block-content .core');
          if (blockContentWrapper && img && dataUrl) {
            blockContentWrapper.innerHTML = '';
            blockContentWrapper.appendChild(img);
          }
        });
    }
  }
}

// @pipelineComponent('Image')
export abstract class GrMLImageSetLoaderBlock extends GrMLBlock {
  public properties: GrMLProperties = {};

  constructor (parent: GrMLFunction) {
    super(parent);
  }
}

