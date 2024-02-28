import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLProperties, GrMLPropertyType } from '../../core/properties';
import { pipelineComponent } from '../../models/pipeline';
import { GrMLType } from '../../core/types';
import { GrMLFunction } from '../../core/function';
import { GrMLCodeSnippet } from '../../core/textual/code-snippet';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../core/representation';
import * as tf from '@tensorflow/tfjs';
import { GrMLModel } from '../../core/model';
import { GrMLExecuteCodeEvent } from '../../core/event';



@pipelineComponent('MNIST', 0)
export class GrMLMinstDataFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-mnist-data';
  };

  public static CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'mnist-data', (varNames, retNames) => [
        'import tensorflow as tf',
        'import tensorflow_datasets as tfds',
        '',
        `(${retNames[0]}, ${retNames[1]}), ds_info = tfds.load(`,
        '  \'mnist\',',
        '  split=[\'train\', \'test\'],',
        '  shuffle_files=True,',
        '  as_supervised=True,',
        '  with_info=True',
        ')',
      ]);
    }
  };

  public static NAME = 'grml_mnist_data';
  public static VERBOSE_NAME = 'MNIST Dataset';
  public static ICON_SRC = 'img/icons/mnist.svg';

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLMinstDataFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLMinstDataFunction.CodeSnippet(this),
  };

  public properties: GrMLProperties = {
    trainSize: {
      label: 'Training Set Size',
      type: GrMLPropertyType.RANGE,
      args: { min: 1000, max: 35000, step: 1000 },
      value: 25000,
      onChange: (v) => {
        this.returnValues[0].type = new GrMLType.Dataset(new GrMLType.Tuple({
          images: new GrMLType.Tensor([ v, 28, 28, 1 ]),
          labels: new GrMLType.Tensor([ v, 10 ]),
        }));
      },
    },

    testSize: {
      label: 'Test Set Size',
      type: GrMLPropertyType.RANGE,
      args: { min: 1000, max: 10000, step: 1000 },
      onChange: (v) => {
        this.returnValues[1].type = new GrMLType.Dataset(new GrMLType.Tuple({
          images: new GrMLType.Tensor([ v, 28, 28, 1 ]),
          labels: new GrMLType.Tensor([ v, 10 ]),
        }));
      },
      value: 10000,
    }
  };

  public mnistData = new MnistData();

  constructor (public parent: GrMLModel) {
    super(GrMLMinstDataFunction.VERBOSE_NAME, 0, 2);

    this.returnValues[0].name = 'training_data';
    this.returnValues[0].type = new GrMLType.Dataset(new GrMLType.Tuple({
      images: new GrMLType.Tensor([ this.properties.trainSize.value, 28, 28,  1 ]),
      labels: new GrMLType.Tensor([ this.properties.trainSize.value, 10 ]),
    }));
    this.returnValues[1].name = 'test_data';
    this.returnValues[1].type = new GrMLType.Dataset(new GrMLType.Tuple({
      images: new GrMLType.Tensor([ this.properties.testSize.value, 28, 28, 1 ]),
      labels: new GrMLType.Tensor([ this.properties.testSize.value, 10 ]),
    }));
    // add both named outputs as varaiables to model
    this.parent?.addVariable(this.returnValues[0].name, this.returnValues[0].type);
    this.parent?.addVariable(this.returnValues[1].name, this.returnValues[1].type);
  }

}

