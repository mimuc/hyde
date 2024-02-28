import { GrMLFunction } from '../../../core/function';
import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLModel } from '../../../core/model';
import { GrMLProperties } from '../../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../../core/representation';
import { GrMLCodeSnippet } from '../../../core/textual/code-snippet';
import { GrMLCompositeLayerFunction } from '../../composite/functions';
import * as tf from '@tensorflow/tfjs';
import { GrMLExecuteCodeEvent } from '../../../core/event';


export class GrMLTensorFlowFlattenFunction extends GrMLCompositeLayerFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-tf-layers-flatten';
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'tf.flatten', (paramNames, retNames) => [
        'tf.keras.layers.Flatten(input_shape=(28, 28)),',
      ]);
    }
  };

  public static NAME = 'tf.layers.flatten';
  public static VERBOSE_NAME = 'tf.layers.flatten';

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLTensorFlowFlattenFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLTensorFlowFlattenFunction.CodeSnippet(this),
  };
  public properties: GrMLProperties = { };

  constructor (public parent: GrMLModel) {
    super(GrMLTensorFlowFlattenFunction.VERBOSE_NAME);
  }
}