import { GrMLDataSet } from '../../../../ext/src/datasets/datasets';
import { GrMLElement } from '../../core/element';
import { GrMLRequestDatasetMessaage } from '../../core/event';
import { GrMLType } from '../../core/types';
import { GrMLImageSetLoaderBlock } from '../img';
import { GrMLOverlay } from '../../elements/overlay';
import { GrMLVSCDataSePartialResponsetMessage } from '../../../../ext/src/messages';
import { NO_DATA_FOUND_RESPONSE } from '../../core/error-reporting';
import * as tf from '@tensorflow/tfjs';
import { GrMLFunction } from '../../core/function';

/**
 * This block provides a data set of cat and dog images.
 * The data is requested from the vsc extension via the @see{GrMLVSCHandler}.
 */
// @pipelineComponent('Datasets')
export class CatDogDataSetBlock extends GrMLImageSetLoaderBlock {
  public static readonly TAG_NAME = 'grml-dataset-pets';
  public static readonly DISPLAY_NAME = 'Pets Dataset';
  public static readonly ICON_SRC = 'img/icons/pets.svg';

  public images: [ tf.Tensor3D, number ][] = [ ];

  constructor (parent: GrMLFunction) {
    super(parent);
    this.parent.returnValues[0].type = new GrMLType.Array(new GrMLType.Tensor([ 128, 128, 3 ]));
    window.dispatchEvent(new GrMLRequestDatasetMessaage(GrMLDataSet.PETS));

    const core = this.shadowRoot?.querySelector('.core');
    core?.appendChild(document.createTextNode('Loading...'));
    const btn = document.createElement('button');
    btn.innerText = 'Preview';

    const overlay = new GrMLOverlay('Pet Dataset');
    const imagePreview = new GrMLImageSetPreview();
    Object.defineProperty(imagePreview, 'images', {
      get: () => this.images,
    });
    overlay.wrapper.appendChild(imagePreview);

    btn.addEventListener('click', () => {
      imagePreview.update();
      overlay.show();
    });

    window.addEventListener('message', (message: MessageEvent<any>) => {
      if (!message || !message.data || !message.data.command) {
        return null;
      }
      switch (message.data.command) {
        case GrMLVSCDataSePartialResponsetMessage.COMMAND: {
          if (message.data.type === GrMLDataSet.PETS) {
            this.images.push(...message.data.dataset
              .map(([ img, label ]: [ number[][][], number ]) => [ tf.tensor3d(img).div(tf.scalar(255)), label === 0 ? 'Cat' : 'Dog' ]));
            console.warn(this.images.length);
            // imagePreview.images = this.images
            //   .map(([ img, i ]) => [ img.div(tf.scalar(255)), i === 0 ? 'Cat' : 'Dog' ]);
            if (core) {
              core.innerHTML = '';
              core.appendChild(btn);
            }
          }
        }
      }
    });
  }

  public data (): Promise<any[]> {
    if (this.images.length > 0) {
      return Promise.resolve([ this.images ]);
    } else {
      return Promise.reject(NO_DATA_FOUND_RESPONSE);
    }
  }
}

export class GrMLImageSetPreview extends GrMLElement {
  public static TAG_NAME = 'grml-image-set-preview';

  public images: [ tf.Tensor3D, string ][] = [ ];

  private imageList = document.createElement('ul');

  constructor () {
    super();
    this.shadowRoot?.appendChild(this.imageList);
  }

  public update (): void {
    // TODO: lazy load images and maintain state across update calls
    this.imageList.innerHTML = '';
    this.images.forEach(async ([ img, label ]) => {
      const li = document.createElement('li');
      const canvas = document.createElement('canvas');
      tf.browser.toPixels(img, canvas);
      li.appendChild(canvas);
      li.appendChild(document.createTextNode(label));
      this.imageList.appendChild(li);
    });
  }
}