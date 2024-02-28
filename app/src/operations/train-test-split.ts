import { GrMLBlock } from '../core/graphical/blocks';
import { GrMLProperties, GrMLPropertyType } from '../core/properties';
import { GrMLType } from '../core/types';
import { GrMLFunction } from '../core/function';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../core/representation';
import { GrMLCodeSnippet } from '../core/textual/code-snippet';
import { pipelineComponent } from '../models/pipeline';
import * as tf from '@tensorflow/tfjs';
import { GrMLExecuteCodeEvent } from '../core/event';
import { NO_DATA_FOUND_RESPONSE } from '../core/error-reporting';

@pipelineComponent('Preprocessing')
export class GrMLTrainTestSplitFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-training-test-split';
    constructor (parent: GrMLFunction) {
      super(parent);
      // TODO Move to function
      this.parent.parameters[0].type = new GrMLType.Array(new GrMLType.Tensor());
      this.parent.returnValues[0].type = new GrMLType.Array(new GrMLType.Tensor());
      this.parent.returnValues[1].type = new GrMLType.Array(new GrMLType.Tensor());
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'train-test-split', (paramNames, retNames, properties) => [ 
        `${retNames.map((r) => r).join(',')} = ${paramNames}.shuffle(ds_info.splits['train'].num_examples)`,
        'dataset = tf.data.Dataset.from_tensor_slices(tensor_list)',
       ]);
    }
  };


  public static NAME = 'train_test_split';
  public static VERBOSE_NAME = 'Train/Test Split';
  public static ICON_SRC = 'img/icons/split.svg';

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLTrainTestSplitFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLTrainTestSplitFunction.CodeSnippet(this),
  };
  public properties: GrMLProperties = {
    ratio: {
      label: 'Train/Test Ratio',
      type: GrMLPropertyType.NUMBER,
      value: 80,
    }
  };

  constructor () {
    super(GrMLTrainTestSplitFunction.VERBOSE_NAME, 1, 2);
  }

  public get ratio (): number {
    return this.properties.ratio.value;
  }

  public set ratio (r: number) {
    this.properties.ratio.value = r;
  }


  public data () {
    // TODO: Flo fix data method
    /* this.parameters[0].data();
    
    const code = this.representations[REPRESENTATION_TYPES.CODE].code;
    window.dispatchEvent(new GrMLExecuteCodeEvent(code)); */

    return;

    /* // TODO Cache this split until new data is provided or the ratio changes
    const data = await this.parameters[0].data();

    if (data) {
      const d = new Array(data.length);
      data.forEach((elem: any, i: number) => d[i] = elem);
      tf.util.shuffle(d);

      return [
        d.slice(0, Math.floor(d.length * this.ratio / 100)),
        d.slice(Math.floor(d.length * this.ratio / 100)),
      ];
    }
    return Promise.reject(NO_DATA_FOUND_RESPONSE); */

  }

}