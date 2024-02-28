import {
  GrMLCompositeLayer,
} from '../composite/blocks';
import {
  GrMLProperties,
  GrMLPropertyType,
} from '../../core/properties';
import {
  NO_DATA_SOURCE_FOR_PORT,
} from '../../core/error-reporting';
import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLFunction } from '../../core/function';
import { GrMLExecuteCodeEvent } from '../../core/event';
import { pipelineComponent } from '../pipeline';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../core/representation';
import { GrMLCodeSnippet } from '../../core/textual/code-snippet';

import * as tf from '@tensorflow/tfjs';
import { GrMLConsole } from '../../core/console';

@pipelineComponent('Mock', 0)
export class MockModelFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-mock-model';

    constructor (parent: GrMLFunction) {
      super(parent);

      const core = this.shadowRoot?.querySelector('.core');
      if (core) {
        const btn = document.createElement('button');
        btn.innerText = 'Execute Code';
        btn.addEventListener('click', () => {
          window.dispatchEvent(new GrMLExecuteCodeEvent((parent.representations[REPRESENTATION_TYPES.CODE] as GrMLCodeSnippet).code, '', parent));
        });
        core.appendChild(btn);
      }
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (public parent: GrMLFunction) {
      super(parent, 'tf.dense', () => [
        `import tensorflow as tf
print('TensorFlow version:', tf.__version__)
mnist = tf.keras.datasets.mnist
(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0
model = tf.keras.models.Sequential([
  tf.keras.layers.Flatten(input_shape=(28, 28)),
  tf.keras.layers.Dense(128, activation='relu'),
  tf.keras.layers.Dropout(0.2),
  tf.keras.layers.Dense(10)
])
predictions = model(x_train[:1]).numpy()
predictions
tf.nn.softmax(predictions).numpy()
loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
loss_fn(y_train[:1], predictions).numpy()
model.compile(optimizer='adam',loss=loss_fn,metrics=['accuracy'])
model.fit(x_train, y_train, epochs=5)
model.evaluate(x_test,  y_test, verbose=2)
probability_model = tf.keras.Sequential([model,tf.keras.layers.Softmax()])
probability_model(x_test[:5])`
      ]);
    }
  };

  public static NAME = 'MockModel';
  public static VERBOSE_NAME = 'MockModel';

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new MockModelFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new MockModelFunction.CodeSnippet(this),
   };

   public properties: GrMLProperties = { };

  constructor () {
    super(MockModelFunction.VERBOSE_NAME);
  }

  public data () {
    throw new Error('Method not implemented.');
  }
}


export class GrMLTensorflowDenseLayerBlock extends GrMLCompositeLayer {
  public static TAG_NAME = 'grml-tf-layers-dense';
  public static DISPLAY_NAME = 'tf.layers.dense';

  public properties: GrMLProperties = {
    'units': { label: 'Units', type: GrMLPropertyType.NUMBER, value: 32, onChange: () => this.updateLayer() },
    'activation': { label: 'Activation Function', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'kernelInitializer': { label: 'Kernel Initializer', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'kernelConstraint': { label: 'Kernel Constraint', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'kernelRegularizer': { label: 'Kernel Regularizer', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'useBias': { label: 'Use Bias?', type: GrMLPropertyType.BOOLEAN, value: undefined, onChange: () => this.updateLayer() },
    'biasInitializer': { label: 'Bias Initializer', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'biasConstraint': { label: 'Bias Constraint', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'biasRegularizer': { label: 'Bias Regularizer', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'activityRegularizer': { label: 'Activity Regularizer', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'inputShape': { label: 'Input Shape', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'batchInputShape': { label: 'Batch Input Shape', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'batchSize': { label: 'Batch Size', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'dtype': { label: 'Data Type', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'name': { label: 'Name', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
    'trainable': { label: 'Trainable', type: GrMLPropertyType.BOOLEAN, value: undefined, onChange: () => this.updateLayer() },
    'weights': { label: 'Weights', type: GrMLPropertyType.STRING, value: undefined, onChange: () => this.updateLayer() },
  };

  private cachedLayer: tf.layers.Layer  = tf.layers.dense({ units: 10 });

  public get layer () {
    return this.cachedLayer;
  }

  public data () {
    /* // TODO: Flo fix data method. Probably CodeSnippet missing since previous `tf.layers.dense` is now supposed to be executed in python?!
    this.inputs[0].data();

    //const code = this.representations[REPRESENTATION_TYPES.CODE].code;
    //window.dispatchEvent(new GrMLExecuteCodeEvent(code)); */

    return;


    /* const input = this.inputs[0].data();
    if (!input) {
      this.inputs[0].warn(NO_DATA_SOURCE_FOR_PORT);
      return [ ];
    }
    const data = this.inputs[0].data();
    return [ this.layer.apply(data) ]; */
  }

  private updateLayer () {
    this.cachedLayer = tf.layers.dense({
      units: this.properties.units.value || undefined,
      activation: this.properties.activation.value || undefined,
      kernelInitializer: this.properties.kernelInitializer.value || undefined,
      kernelConstraint: this.properties.kernelConstraint.value || undefined,
      kernelRegularizer: this.properties.kernelRegularizer.value || undefined,
      useBias: this.properties.useBias.value || undefined,
      biasInitializer: this.properties.biasInitializer.value || undefined,
      biasConstraint: this.properties.biasConstraint.value || undefined,
      biasRegularizer: this.properties.biasRegularizer.value || undefined,
      activityRegularizer: this.properties.activityRegularizer.value || undefined,
      inputShape: this.properties.inputShape.value || undefined,
      batchInputShape: this.properties.batchInputShape.value || undefined,
      batchSize: this.properties.batchSize.value || undefined,
      dtype: this.properties.dtype.value || undefined,
      name: this.properties.name.value || undefined,
      trainable: this.properties.trainable.value || undefined,
      weights: this.properties.weights.value || undefined,
    });
  }

}


export class GrMLTensorflowConv2DLayerBlock extends GrMLCompositeLayer {
  public static TAG_NAME = 'grml-tf-layers-conv2d';
  public static DISPLAY_NAME = 'tf.layers.conv2d';
  public layer: tf.layers.Layer = tf.layers.conv2d({ kernelSize: [ 3, 3 ], filters: 32 });
}


export class GrMLTensorflowMaxPooling2DLayerBlock extends GrMLCompositeLayer {
  public static TAG_NAME = 'grml-tf-layers-maxpooling2d';
  public static DISPLAY_NAME = 'tf.layers.MaxPooling2D';
  public layer: tf.layers.Layer = tf.layers.maxPooling2d({ });
}


// export class GrMLTensorflowSliceLayerBlock extends GrMLActionLayer {
//   public static TAG_NAME = 'grml-tf-action-slice';
//   public static DISPLAY_NAME = 'tf.slice';
//   public action = (t: tf.Tensor) => t.slice(this.properties['from'].value, this.properties['to'].value);
// }

// function layerFactory (
//   tagName: string,
//   displayName: string,
//   properties: GrMLProperties = { },
//   dataFunction: () => Promise<any[]>,
//   layerConstructor: any,
//   layerDefaultArgs: any[]
// ) {
//   class FactoryTFLayer extends GrMLCompositeLayer {
//     public static TAG_NAME = tagName;
//     public static DISPLAY_NAME = displayName;
//     public layer: tf.layers.Layer = layerConstructor(...layerDefaultArgs);
//     public properties = properties;
//     public data (): Promise<any[]> {
//       return dataFunction.bind(this)();
//     }
//   }
//   return FactoryTFLayer;
// }

export const TF_BLOCKS = [
  GrMLTensorflowDenseLayerBlock,
  GrMLTensorflowConv2DLayerBlock,
  GrMLTensorflowMaxPooling2DLayerBlock,
];
