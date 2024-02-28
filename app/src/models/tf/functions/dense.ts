import { GrMLPropertiesChangedEvent } from '../../../core/event';
import { GrMLFunction } from '../../../core/function';
import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLProperties, GrMLPropertyType } from '../../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../../core/representation';
import { GrMLCodeSnippet } from '../../../core/textual/code-snippet';
import { GrMLCompositeLayerFunction } from '../../composite/functions';
import * as tf from '@tensorflow/tfjs';



export class GrMLTensorflowDenseLayerFunction extends GrMLCompositeLayerFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-tf-layers-dense';
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (public parent: GrMLFunction) {
      super(parent, 'tf.dense', (paramNames, retNames, properties) => [
        `tf.keras.layers.Dense(${properties?.units?.value || ' '}, activation='${properties?.activation?.value || ' '}'),`
      ]);
    }
  };

  public static NAME = 'tf.layers.dense';
  public static VERBOSE_NAME = 'tf.layers.dense';

  public representations: VariousRepresentations  & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLTensorflowDenseLayerFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLTensorflowDenseLayerFunction.CodeSnippet(this),
   };

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

  // TODO: Flo probably remove cachedLayer and updateLayer. What is dispatchEvent GrMLPropertiesChanged used for.
  private cachedLayer: tf.layers.Layer  = tf.layers.dense({ units: 10 });


  constructor () {
    super(GrMLTensorflowDenseLayerFunction.VERBOSE_NAME);
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
    window.dispatchEvent(new GrMLPropertiesChangedEvent(this.uuid, this.properties)); // notify other editors: props changed
  }

}