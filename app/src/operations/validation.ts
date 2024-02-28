import { GrMLBlock } from '../core/graphical/blocks';
import { GrMLProperties } from '../core/properties';
import { GrMLType } from '../core/types';
import { pipelineComponent } from '../models/pipeline';
import {
  WithBlockRepresentation,
  WithCodeRepresentation,
  HasBlockRepresentation,
  HasCodeRepresentation,
  REPRESENTATION_TYPES,
  VariousRepresentations,
} from '../core/representation';
import { GrMLCodeSnippet } from '../core/textual/code-snippet';
import { GrMLFunction } from '../core/function';
import { GrMLConsole } from '../core/console';
import { NO_DATA_FROM_INPUT, Warning } from '../core/error-reporting';


@pipelineComponent('Validation', 3)
export class GrMLValidationFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {

  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-model-validation';
    constructor (parent: GrMLValidationFunction) {
      super(parent);
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'validation', (varNames, retNames) => [
        //`${parameters[ 1 ]} = ${parameters[ 1 ]}.map(normalize_img, num_parallel_calls=tf.data.AUTOTUNE)`,
        //`${parameters[ 1 ]} = ${parameters[ 1 ]}.batch(128)`
        `${retNames[0]} = ${varNames[0]}.evaluate(${varNames[1]})`,
        `print(${retNames[0]})`,
      ]);
    }
  };

  public static NAME = 'grml_model_validation';
  public static VERBOSE_NAME = 'Validation';

  public executable = true;

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLValidationFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLValidationFunction.CodeSnippet(this),
  };
  public properties: GrMLProperties = { };


  constructor () {
    super(GrMLValidationFunction.VERBOSE_NAME, 2, 1);
    this.parameters[0].type = new GrMLType.Model();
    this.parameters[0].name = 'model';
    this.parameters[1].type = new GrMLType.Dataset(new GrMLType.Tuple(
      new GrMLType.Tensor(),
      new GrMLType.Tensor(),
    ));
    this.parameters[1].name = 'test_data';

    /* this.returnValues[0].type = new GrMLType.Array(GrMLType.Number);
    this.returnValues[0].name = 'loss, accuracy'; */

    this.returnValues[0].type = new GrMLType.Tuple({
      loss: GrMLType.Number,
      accurracy: GrMLType.Number,
    });
    this.returnValues[0].name = 'loss, accuracy';
  }

  public async execute (): Promise<void> {
    this.validate();
  }

  public async validate () {
    // TODO: Flo remove since done in python
    const model = this.parameters[0].data();
    const input = this.parameters[1].data();

    if (
      !model ||
      model instanceof Warning ||
      !input ||
      input instanceof Warning
    ) {
      GrMLConsole.log('No model found to validate.');
      return this.addWarning(NO_DATA_FROM_INPUT);
    }
    this.removeWarning(NO_DATA_FROM_INPUT);

    this.data();
  }

  public data () {
    /* // TODO: Flo fix data method. Since no returnValues, what to execute when `alreadyComputed`
    this.parameters[0].data();
    this.parameters[1].data();

    const code = this.representations[REPRESENTATION_TYPES.CODE].code;
    window.dispatchEvent(new GrMLExecuteCodeEvent(code)); */

    return;

    /* const model: tf.LayersModel = await this.parameters[0].data();
    const input: tf.data.Dataset<any> = await this.parameters[1].data();
    const [ _, metrics ] = <tf.Scalar[]> await model.evaluateDataset(input);
    return [ metrics ]; */
  }
}

