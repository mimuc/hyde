import { GrMLCompositeNNModel } from '../composite';
import { GrMLTensorflowSequentialEditor } from './editor';
import { GrMLModel } from '../../core/model';
import { GrMLEditor } from '../../core/editor';
import { MODEL_INCOMPLETE } from '../../core/error-reporting';
import { GrMLFunction } from '../../core/function';
import { GrMLConnection } from '../../core/functionIO';
import * as tf from '@tensorflow/tfjs';
import { GrMLTensorFlowFlattenFunction } from './functions/flatten';
import { GrMLTensorflowDenseLayerFunction } from './functions/dense';
import { GrMLCompositeLayerFunction } from '../composite/functions';
import { GrMLInputFunction, GrMLOutputFunction } from '../composite/functions/functionIO';

export class GrMLTensorflowSequentialModel extends GrMLCompositeNNModel {
  public static TYPE = 'grml-tensorflow-sequential-model';

  public editor: GrMLEditor<GrMLModel> = new GrMLTensorflowSequentialEditor(
    this,
    {
      layers: [
        GrMLTensorflowDenseLayerFunction,
        GrMLTensorFlowFlattenFunction,
      ]
    }
  );

  public name = 'tf.sequential';
  public model: tf.LayersModel | null = null;
  public layers: GrMLFunction[] = [];

  public update () {
    console.info('Reconstructing model graph');
    // Reconstruct the path which data has to take through this model and collect all layers
    const inputFunctions = this.children.filter((f) => f instanceof GrMLInputFunction);
    // No inputs found
    if (!inputFunctions.length) {
      this.model = null;
      this.parent?.addWarning(MODEL_INCOMPLETE);
      return;
    }
    this.layers = [];

    const funcsToIterate: GrMLFunction[] = [ this.children[0] ];
    while (funcsToIterate.length) {
      const currFunc = funcsToIterate.shift();
      if (!currFunc) {
        break;
      }
      currFunc.returnValues.forEach((retVal) => {
        if (retVal.connections[0]?.end?.parent) {
          const connectedFunc = retVal.connections[0].end.parent;
          this.layers.push(connectedFunc);
          funcsToIterate.push(connectedFunc);
        }
      });
    }

    if (this.parent) {
      this.parent.codeEditTimestamp = new Date();
    }
  }

  public createInputFunction () {
    if (!this.children.length) {
      const inputFunction = new GrMLInputFunction(this);
      const inputFunctionWithRepresentations = this.addFunction(inputFunction);
      const block = <any>inputFunctionWithRepresentations.representations[this.editor.REPRESENTATION_TYPE];
      if (block) {
        block.x = 100;
        block.y = 100;
      }
    }
  }
}
