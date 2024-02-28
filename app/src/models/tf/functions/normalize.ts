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
export class GrMLTensorflowNormalizeFunction extends GrMLActionLayerFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-tf-actions-normalize';
  };
  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'tf.sequential', (paramNames, retNames, properties, functionName = 'normalize_img') => [
        `def ${functionName}(image, label):`,
        '    return tf.cast(image, tf.float32) / 255., label',
        `${retNames.map((r) => r).join(',')} = ${paramNames}.map(${functionName}, num_parallel_calls=tf.data.AUTOTUNE)`,
        `${retNames[0]} = ${retNames[0]}.batch(128)`
      ]);
      }
  };

  public static NAME = 'tf.normalize';
  public static VERBOSE_NAME = 'tf.normalize';


  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLTensorflowNormalizeFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLTensorflowNormalizeFunction.CodeSnippet(this),
   };

  public properties: GrMLProperties = {};

  constructor (public parent: GrMLModel) {
    super(GrMLTensorflowNormalizeFunction.VERBOSE_NAME);
    this.parameters[ 0 ].type = new GrMLType.Dataset();
    this.returnValues[ 0 ].type = new GrMLType.Dataset();
  }

}


