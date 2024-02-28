import { GrMLBlock, GrMLModelBlock } from '../../core/graphical/blocks';
import { GrMLSubModelSelectedEvent } from '../../core/event';
import { GrMLInputPort } from '../../core/graphical/ports';
import { GrMLProperties } from '../../core/properties';
import { GrMLInputBlock, GrMLOutputBlock } from '../../operations/group';
import { GrMLCompositeNNModel } from './model';
import { GrMLType } from '../../core/types';
import { GrMLFunction } from '../../core/function';
import { REPRESENTATION_TYPES } from '../../core/representation';
import { GrMLReturnValue } from '../../core/functionIO';
import * as tf from '@tensorflow/tfjs';

/**
 * Composite Neural Network, which can be composed of multiple subnetworks, layers or neurons
 * @see {GrMLCompositeNeuron}
 * @see {GrMLCompositeLayer}
 *
 * TODO: rework as function and delete Block
 */
export abstract class GrMLCompositeNNBlock extends GrMLModelBlock {
  public static TAG_NAME = 'grml-composite-nn';
  public static DISPLAY_NAME = 'Composite NN';

  public properties: GrMLProperties = { };

  constructor (parent: GrMLFunction, model: GrMLCompositeNNModel = new GrMLCompositeNNModel()) {
    super(parent, model);

    this.parent.returnValues[0].type = new GrMLType.Model();
    this.parent.returnValues[0].name = 'model';

    const img = <HTMLImageElement> this.shadowRoot?.querySelector('.header img');
    if (img) {
      img.src = 'img/icons/composite.svg';
    }

    this.addEventListener(
      'dblclick',
      () => window.dispatchEvent(new GrMLSubModelSelectedEvent(this.model.path))
    );
  }

  public update () {
    this.model.update();
    // TODO: rework
    const inputFunctions = this.model.children.filter((b) => b.representations[REPRESENTATION_TYPES.BLOCK] instanceof GrMLInputBlock);
    const modelInputs = <GrMLInputBlock[]> inputFunctions.map(f => f.representations[REPRESENTATION_TYPES.BLOCK]);
    const outputFunctions = this.model.children.filter((b) => b.representations[REPRESENTATION_TYPES.BLOCK] instanceof GrMLOutputBlock);
    const modelOutputs = <GrMLOutputBlock[]> outputFunctions.map(f => f.representations[REPRESENTATION_TYPES.BLOCK]);
    console.log(modelInputs);

    if (this.inputs.length < modelInputs.length) {
      // Add missing inputs
      modelInputs.forEach((inputBlock, index) => {
        if (!this.inputs[index]) {
          const i = new GrMLInputPort(this, this.parent.parameters[index]);
          i.name = inputBlock.name || 'Input';
          this.inputs.push(i);
          i.parent = this;
          this.shadowRoot?.querySelector('.inputs')?.append(i);
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
      this.parent.parameters[i].type = modelInputs[i].inputType;
    });

    const defaultModelOutput = this.parent.returnValues[0];
    const dataOutputs = this.parent.returnValues.slice(1);
    if (dataOutputs.length < modelOutputs.length) {
      // Add missing outputs
      modelOutputs.forEach((outputBlock, index) => {
        if (!dataOutputs[index]) {
          const o = new GrMLReturnValue(this.parent);
          o.name = outputBlock.name || 'Output';
          dataOutputs.push(o);
          // FIXME
          // this.shadowRoot?.querySelector('.outputs')?.append(o);
        }
        this.parent.returnValues = [ defaultModelOutput, ...dataOutputs ];
      });
    } else if (this.outputs.length > modelOutputs.length) {
      // Remove obsolte outputs
      dataOutputs.forEach((output, index) => {
        if (index >= modelOutputs.length) {
          output.remove();
        }
      });
      this.parent.returnValues = [ defaultModelOutput, ...dataOutputs.slice(0, modelOutputs.length) ];
    }

    defaultModelOutput.type = new GrMLType.Model();
    defaultModelOutput.name = 'model';
    dataOutputs.forEach((output, i) => {
      output.type = modelOutputs[i].outputType;
      output.name = modelOutputs[i].name;
    });

  }
}

/**
 * An individual neuron of a neural network
 *
 * TODO: rework as function and delete Block
 */
export class GrMLCompositeNeuron extends GrMLBlock {
  public static TAG_NAME = 'grml-composite-neuron';
  public static DISPLAY_NAME = 'Neuron';

  public properties: GrMLProperties = { };

  public data (): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
}

/**
 * TODO: rework as function and delete Block
 */
export abstract class GrMLCompositeLayer extends GrMLBlock {
  public static TAG_NAME = 'grml-composite-layer';
  public static DISPLAY_NAME = 'Layer';
  public properties: GrMLProperties = { };
  public abstract layer: any;


  constructor (parent: GrMLFunction) {
    super(parent);

    this.parent.parameters[0].type = new GrMLType.Union(new GrMLType.Dataset(), new GrMLType.Tensor());
    this.parent.parameters[0].type = new GrMLType.Union(new GrMLType.Dataset(), new GrMLType.Tensor());
  }


  public data () {
    throw new Error('Method not implemented.');
  }
}
