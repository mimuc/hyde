import { GrMLFunction } from '../../../core/function';
import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLModel } from '../../../core/model';
import { GrMLProperties } from '../../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../../core/representation';
import { GrMLCodeSnippet } from '../../../core/textual/code-snippet';
import { GrMLType } from '../../../core/types';
import { pipelineComponent } from '../../pipeline';
import { GrMLActionLayerFunction } from '../functions';

@pipelineComponent('Preprocessing', 1)
export class GrMLTensorflowShuffleLayerFunction extends GrMLActionLayerFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-tf-actions-shuffle';
  };
  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'tf.sequential', (paramNames, retNames, properties) => [
        `${retNames.map((r) => r).join(',')} = ${paramNames}.shuffle(ds_info.splits['train'].num_examples)`,
      ]);
    }
  };

  public static NAME = 'tf.shuffle';
  public static VERBOSE_NAME = 'tf.shuffle';


  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLTensorflowShuffleLayerFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLTensorflowShuffleLayerFunction.CodeSnippet(this),
   };

  public properties: GrMLProperties = {};

  constructor (public parent: GrMLModel) {
    super(GrMLTensorflowShuffleLayerFunction.VERBOSE_NAME);
    this.parameters[ 0 ].type = new GrMLType.Dataset();
    this.returnValues[ 0 ].type = new GrMLType.Dataset();
  }

}


