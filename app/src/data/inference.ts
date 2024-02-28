import { GrMLBlock } from '../core/graphical/blocks';
import { GrMLProperties } from '../core/properties';
import { GrMLType } from '../core/types';
import { pipelineComponent } from '../models/pipeline';
import { GrMLFunction } from '../core/function';
import { GrMLCodeSnippet } from '../core/textual/code-snippet';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../core/representation';
import { NO_DATA_FROM_INPUT, Warning } from '../core/error-reporting';
import { GrMLConsole } from '../core/console';




/**
 * from GrMLInferenceBlock
 */
@pipelineComponent('Inference', 4)
export class  GrMLInferenceFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {

  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-inference-block';

    constructor (parent: GrMLInferenceFunction) {
      super(parent);
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (parent: GrMLFunction) {
      super(parent, 'inference', (varNames, retNames) => [
        `${retNames[0]} = ${varNames[0]}.predict(${varNames[1]})`,
        `print(${retNames[0]})`,
      ]);
    }
  };



  public static NAME = 'grml_predict';
  public static VERBOSE_NAME = 'Prediction';
  public static DESCRIPTION = 'Apply a trained model to new input data.';

  public executable = true;

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLInferenceFunction.Block(this),
    [REPRESENTATION_TYPES.CODE]: new GrMLInferenceFunction.CodeSnippet(this),
  };
  public properties: GrMLProperties = { };

  constructor (){
    super(GrMLInferenceFunction.VERBOSE_NAME, 2, 1);
    this.parameters[0].name = 'Model';
    this.parameters[0].type = new GrMLType.Model();
    this.parameters[1].name = 'test_data';
    this.parameters[1].type = new GrMLType.Tensor();

    this.returnValues[0].name = 'predictions';
    this.returnValues[0].type = new GrMLType.Array(new GrMLType.Array(GrMLType.Number));
  }

  public async execute (): Promise<void> {
    this.show();
  }

  public show () {
    // TODO: Flo
    const model = this.parameters[0].data();
    const input = this.parameters[1].data();

    if (
      !model ||
      model instanceof Warning ||
      !input ||
      input instanceof Warning) {
      GrMLConsole.log('Missing input to predict.');
      return this.addWarning(NO_DATA_FROM_INPUT);
    }
    this.removeWarning(NO_DATA_FROM_INPUT);

    this.data();
  }


  public data () {
    // TODO: Flo fix data method
    return;
  }
}