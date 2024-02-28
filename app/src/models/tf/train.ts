import { GrMLConsole } from '../../core/console';
import { Warning } from '../../core/error-reporting';
import { GrMLFunction } from '../../core/function';
import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLProperties, GrMLPropertyType } from '../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../core/representation';
import { GrMLCodeSnippet } from '../../core/textual/code-snippet';
import { GrMLType } from '../../core/types';
import { pipelineComponent } from '../pipeline';

@pipelineComponent('Tensorflow')
export class GrMLTensorflowTrainFunction extends GrMLFunction implements HasBlockRepresentation, HasCodeRepresentation {
    public static readonly Block = class C extends GrMLBlock {
        public static TAG_NAME = 'grml-train';
    };

    public static CodeSnippet = class C extends GrMLCodeSnippet {
        constructor (parent: GrMLFunction) {
            super(parent, 'train', (varNames, retNames, properties) => [
                `${retNames[0]} = tf.keras.models.clone_model(${varNames[0]})`,
                `${retNames[0]}.compile(optimizer='adam', loss=loss_fn, metrics=['accuracy'])`,
                `${retNames[0]}.fit(${varNames[1]}, epochs=${properties?.epochs?.value || 1})`
            ]);
        }
    };

    public static NAME = 'grml_train';
    public static VERBOSE_NAME = 'tf.train';
    public static ICON_SRC = 'img/14.jpg';

    public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
        [REPRESENTATION_TYPES.BLOCK]: new GrMLTensorflowTrainFunction.Block(this),
        [REPRESENTATION_TYPES.CODE]: new GrMLTensorflowTrainFunction.CodeSnippet(this),
    };
    public properties: GrMLProperties = {
        epochs: {
          label: 'Epochs',
          type: GrMLPropertyType.NUMBER,
          value: 5,
        }
    };

    constructor () {
        super(GrMLTensorflowTrainFunction.VERBOSE_NAME, 2, 1);

        this.parameters[0].type = new GrMLType.Model();
        this.parameters[1].type = new GrMLType.Dataset();

        this.returnValues[0].type = new GrMLType.Model();
    }
}