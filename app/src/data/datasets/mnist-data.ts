import * as tf from '@tensorflow/tfjs';
import { GrMLConsole } from '../../core/console';

const IMAGE_WIDTH = 28;
const IMAGE_HEIGHT = 28;
const IMAGE_SIZE = IMAGE_WIDTH * IMAGE_HEIGHT;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;

const NUM_TRAIN_ELEMENTS = 55000;
const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;

const MNIST_IMAGES_SPRITE_PATH = '../data/mnist/mnist_images.png';
const MNIST_LABELS_PATH = '../data/mnist/mnist_labels_uint8';


/**
 * A class that fetches the sprited MNIST dataset and returns shuffled batches.
 *
 * NOTE: This will get much easier. For now, we do data fetching and
 * manipulation manually.
 */

export class MnistData {
  private static trainImages: any = null;
  private static trainLabels: any = null;
  private static testImages: any = null;
  private static testLabels: any = null;
  private static shuffledTrainIndex = 0;
  private static shuffledTestIndex = 0;
  private static datasetImages: Float32Array | null = null;
  private static datasetLabels: Uint8Array | null = null;
  private static trainIndices: any = null;
  private static testIndices: any = null;
  private static img: HTMLImageElement | null = null;

  public trainingData (n?: number): tf.TensorContainer {
    return tf.tidy(() => {
      const xs = tf.tensor(MnistData.trainImages, [ NUM_TRAIN_ELEMENTS, IMAGE_WIDTH, IMAGE_HEIGHT, 1 ]);
      const ys = tf.tensor(MnistData.trainLabels, [ NUM_TRAIN_ELEMENTS, NUM_CLASSES ]);
      if (n) {
        return { xs: xs.slice(0, n), ys: ys.slice(0, n) };
      }
      return { xs, ys };
    });
  }

  public testData (n?: number): tf.TensorContainer {
    return tf.tidy(() => {
      const xs = tf.tensor(MnistData.testImages, [ NUM_TEST_ELEMENTS, IMAGE_WIDTH, IMAGE_HEIGHT, 1 ]);
      const ys = tf.tensor(MnistData.testLabels, [ NUM_TEST_ELEMENTS, NUM_CLASSES ]);
      if (n) {
        return { xs: xs.slice(0, n), ys: ys.slice(0, n) };
      }
      return { xs, ys };
    });
  }

  async load () {
    if (MnistData.img) {
      return;
    }
    // Make a request for the MNIST sprited image.
    MnistData.img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }

    const imgRequest = new Promise((resolve, reject) => {
      if (!MnistData.img) {
        return reject();
      }
      MnistData.img.crossOrigin = '';
      MnistData.img.addEventListener('error', () => MnistData.img = null);
      MnistData.img.onload = () => {
        if (!MnistData.img) {
          return;
        }

        MnistData.img.width = MnistData.img.naturalWidth;
        MnistData.img.height = MnistData.img.naturalHeight;

        const datasetBytesBuffer = new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

        const chunkSize = 5000;
        canvas.width = MnistData.img.width;
        canvas.height = chunkSize;

        for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
          const datasetBytesView = new Float32Array(
            datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
            IMAGE_SIZE * chunkSize);
          ctx.drawImage(MnistData.img, 0, i * chunkSize, MnistData.img.width, chunkSize, 0, 0, MnistData.img.width, chunkSize);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          for (let j = 0; j < imageData.data.length / 4; j++) {
            // All channels hold an equal value since the image is grayscale, so
            // just read the red channel.
            datasetBytesView[ j ] = imageData.data[ j * 4 ];
          }
        }
        MnistData.datasetImages = new Float32Array(datasetBytesBuffer);
        GrMLConsole.log('Finished loading MNIST dataset.');
        resolve(null);
      };
      MnistData.img.src = MNIST_IMAGES_SPRITE_PATH;
    });

    const labelsRequest = fetch(MNIST_LABELS_PATH);
    const [ imgResponse, labelsResponse ] =
      await Promise.all([ imgRequest, labelsRequest ]);

    MnistData.datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer());

    // Create shuffled indices into the train/test set for when we select a
    // random dataset element for training / validation.
    MnistData.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
    MnistData.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);

    if (!MnistData.datasetImages) {
      return null;
    }

    // Slice the the images and labels into train and test sets.
    MnistData.trainImages = MnistData.datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    MnistData.testImages = MnistData.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    MnistData.trainLabels = MnistData.datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
    MnistData.testLabels = MnistData.datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
  }

  nextTrainBatch (batchSize: number) {
    return this.nextBatch(
      batchSize, [ MnistData.trainImages, MnistData.trainLabels ], () => {
        MnistData.shuffledTrainIndex =
          (MnistData.shuffledTrainIndex + 1) % MnistData.trainIndices.length;
        return MnistData.trainIndices[ MnistData.shuffledTrainIndex ];
      });
  }

  nextTestBatch (batchSize: number) {
    return this.nextBatch(batchSize, [ MnistData.testImages, MnistData.testLabels ], () => {
      MnistData.shuffledTestIndex =
        (MnistData.shuffledTestIndex + 1) % MnistData.testIndices.length;
      return MnistData.testIndices[ MnistData.shuffledTestIndex ];
    });
  }

  nextBatch (batchSize: number, data: any, index: any) {
    const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
    const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

    for (let i = 0; i < batchSize; i++) {
      const idx = index();

      const image =
        data[ 0 ].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
      batchImagesArray.set(image, i * IMAGE_SIZE);

      const label =
        data[ 1 ].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
      batchLabelsArray.set(label, i * NUM_CLASSES);
    }

    const xs = tf.tensor2d(batchImagesArray, [ batchSize, IMAGE_SIZE ]);
    const labels = tf.tensor2d(batchLabelsArray, [ batchSize, NUM_CLASSES ]);

    return { xs, labels };
  }
}
