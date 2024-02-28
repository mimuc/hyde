import { NO_DATA_FOUND_RESPONSE } from '../../../core/error-reporting';
import { GrMLFunction } from '../../../core/function';
import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLModel } from '../../../core/model';
import { GrMLProperties, GrMLPropertyType } from '../../../core/properties';
import { HasBlockRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation } from '../../../core/representation';
import { GrMLDataType, GrMLType } from '../../../core/types';

enum InputTypes {
  NONE = 'None',
  DATASET = 'Dataset',
  MODEL = 'Model',
  TENSOR = 'Tensor',
}


/**
 * Input function for a tf.model.
 *
 */
export class GrMLInputFunction extends GrMLFunction implements HasBlockRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-composite-input';
  };

  public static NAME = 'Input';
  public static VERBOSE_NAME = 'Input';

  public representations: VariousRepresentations & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLInputFunction.Block(this),
   };

  public properties: GrMLProperties = {
    type: {
      label: 'Datatype',
      type: GrMLPropertyType.SELECT,
      args: { options: Object.values(InputTypes) },
      description: 'The datatype expected at this port',
      value: 'None',
      onChange: () => this.returnValues[ 0 ].type = this.inputType, // no need to notify props change, no code representation
    }
  };

  public removable = false;


  constructor (public parent: GrMLModel) {
    super(GrMLInputFunction.VERBOSE_NAME, 0, 1);
  }

  public get inputType (): GrMLDataType {
    switch (this.properties.type.value) {
      case InputTypes.DATASET:
        return new GrMLType.Dataset();
      case InputTypes.MODEL:
        return new GrMLType.Model();
      case InputTypes.TENSOR:
        return new GrMLType.Tensor();
      default:
        return GrMLType.None;
    }
  }

  public data () {
    // TODO: Flo fix data method
    return;

    /* const ownIndex = this.parent?.children
      .filter((b) => b instanceof GrMLInputFunction)
      .indexOf(this);

    if (ownIndex) {
      const grandparent = this.parent?.parent;
      if (grandparent) {
        return grandparent.parameters[ ownIndex ].data();
      } else {
        return Promise.reject(NO_DATA_FOUND_RESPONSE);
      }
    }

    return Promise.resolve([]); */
  }
}


/**
 * Output or return value function for a tf.model.
 *
 * @see {GrMLInputBlock}
 */
export class GrMLOutputFunction extends GrMLFunction implements HasBlockRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-composite-output';
  };
  public static NAME = 'Output';
  public static VERBOSE_NAME = 'Output';

  public representations: VariousRepresentations & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.BLOCK]: new GrMLOutputFunction.Block(this),
  };

  public properties: GrMLProperties = {
    type: {
      label: 'Datatype',
      type: GrMLPropertyType.SELECT,
      args: { options: Object.values(InputTypes) },
      description: 'The datatype expected at this port',
      value: 'None',
      onChange: () => this.parameters[0].type = this.outputType,
    }
  };

  constructor (public parent: GrMLModel) {
    super(GrMLOutputFunction.VERBOSE_NAME, 1, 0);
  }

  public get outputType (): GrMLDataType {
    switch (this.properties.type.value) {
      case InputTypes.DATASET:
        return new GrMLType.Dataset();
      case InputTypes.MODEL:
        return new GrMLType.Model();
      case InputTypes.TENSOR:
        return new GrMLType.Tensor();
      default:
        return GrMLType.None;
    }
  }


  public data (uuid: string) {
    return this.parameters[ 0 ].data(uuid);
  }
}