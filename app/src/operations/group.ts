import { GrMLModelBlock, GrMLBlock } from '../core/graphical/blocks';
import { GrMLSubModelSelectedEvent } from '../core/event';
import { GrMLFunction } from '../core/function';
import { GrMLProperties, GrMLPropertyType } from '../core/properties';
import { GrMLDataType, GrMLType } from '../core/types';
import { GrMLPipelineModel } from '../models/pipeline';
import { GrMLParameter, GrMLReturnValue } from '../core/functionIO';

enum InputTypes {
  NONE = 'None',
  DATASET = 'Dataset',
  MODEL = 'Model',
  TENSOR = 'Tensor',
}

export class GrMLInputBlock extends GrMLBlock {
  public static TAG_NAME = 'grml-composite-input';
  public static DISPLAY_NAME = 'Input';

  public properties: GrMLProperties = {
    type: {
      label: 'Datatype',
      type: GrMLPropertyType.SELECT,
      args: { options: Object.values(InputTypes) },
      description: 'The datatype expected at this port',
      value: 'None',
      onChange: () => this.parent.returnValues[0].type = this.inputType,
    }
  };

  constructor (parent: GrMLFunction) {
    super(parent);
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

  public data (): Promise<any[]> {
    // FIXME
    // const ownIndex = this.parent?.children
    //   .filter((b) => b instanceof GrMLInputBlock)
    //   .indexOf(this);

    // if (ownIndex) {
    //   const grandparent = this.parent?.parent;
    //   if (grandparent) {
    //     return grandparent.inputs[ownIndex].data();
    //   } else {
    //     return Promise.reject(NO_DATA_FOUND_RESPONSE);
    //   }
    // }

    return Promise.resolve([ ]);
  }
}

export class GrMLOutputBlock extends GrMLBlock{
  public static TAG_NAME = 'grml-composite-output';
  public static DISPLAY_NAME = 'Output';

  public properties: GrMLProperties = {
    type: {
      label: 'Datatype',
      type: GrMLPropertyType.SELECT,
      args: { options: Object.values(InputTypes) },
      description: 'The datatype expected at this port',
      value: 'None',
      onChange: () => this.parent.parameters[0].type = this.outputType,
    }
  };

  constructor (parent: GrMLFunction) {
    super(parent);
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


  public data () {
    return this.inputs[0].data();
  }
}

export class GrMLGroupBlock extends GrMLModelBlock {
  public static TAG_NAME = 'grml-group-block';
  public static DISPLAY_NAME = 'Group';

  public properties: GrMLProperties = { };

  constructor (parent: GrMLFunction, public model = new GrMLPipelineModel()) {
    super(parent, model);
    this.name = 'Group';

    this.addEventListener(
      'dblclick',
      () => window.dispatchEvent(new GrMLSubModelSelectedEvent(this.model.path))
    );
  }

  public data (): Promise<any[]> {
    return Promise.all(this.model.children
      .filter((b) => b instanceof GrMLOutputBlock)
      .map((b) => b.data())
    );
  }

  public update () {
    const modelInputs = this.model.children.filter((b) => b instanceof GrMLInputBlock);
    const modelOutputs = this.model.children.filter((b) => b instanceof GrMLOutputBlock);

    if (this.inputs.length < modelInputs.length) {
      // Add missing inputs
      modelInputs.forEach((inputBlock, index) => {
        if (!this.inputs[index]) {
          const i = new GrMLParameter(this.parent);
          i.name = inputBlock.name || 'Input';
          this.parent.parameters.push(i);
          // FIXME
          // this.shadowRoot?.querySelector('.inputs')?.append(i);
        }
      });
    } else if (this.inputs.length > modelInputs.length) {
      // Remove obsolte inputs
      this.inputs.forEach((input, index) => {
        if (index >= modelInputs.length) {
          input.remove();
        }
      });
      this.inputs = this.inputs.slice(0, modelInputs.length);
    }

    this.inputs.forEach((input, i) => {
      input.name = modelInputs[i].name;
    });


    if (this.parent.returnValues.length < modelOutputs.length) {
      // Add missing outputs
      modelOutputs.forEach((outputBlock, index) => {
        if (!this.parent.returnValues[index]) {
          const o = new GrMLReturnValue(this.parent);
          o.name = outputBlock.name || 'Output';
          this.parent.parameters.push(o);
          // FIXME
          // this.shadowRoot?.querySelector('.outputs')?.append(o);
        }
      });
    } else if (this.outputs.length > modelOutputs.length) {
      // Remove obsolte outputs
      this.outputs.forEach((output, index) => {
        if (index >= modelOutputs.length) {
          output.remove();
        }
      });
      this.outputs = this.outputs.slice(0, modelOutputs.length);

    }

    this.outputs.forEach((output, i) => {
      output.name = modelOutputs[i].name;
    });

  }
}