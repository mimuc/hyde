import { GrMLModelFunction } from '../../../core/function';
import { GrMLParameter, GrMLReturnValue } from '../../../core/functionIO';
import { GrMLModel } from '../../../core/model';
import { GrMLType } from '../../../core/types';
import { GrMLInputFunction, GrMLOutputFunction } from './functionIO';

export abstract class GrMLCompositeNNFunction extends GrMLModelFunction {

  constructor (functionName: string = GrMLCompositeNNFunction.VERBOSE_NAME, public model: GrMLModel, parameterCount = 0, returnValueCount = 1) {
    super(functionName, model, parameterCount, returnValueCount);

    this.returnValues[0].type = new GrMLType.Model();
    this.returnValues[0].name = 'model';
    this.parent?.addVariable(this.returnValues[0].name, this.returnValues[0].type);
  }

  public update (): void {

    // Output functiones from the associated model
    const revalFunctions = this.model.children.filter((f) => f instanceof GrMLOutputFunction) as GrMLOutputFunction[];

    // add missing GrMLInputFunctions as parameters
    if (this.parameters.length < paramFunctions.length) {
      // Add missing inputs
      paramFunctions.forEach((paramFunction, index: number) => {
        if (!this.parameters[ index ]) {
          const newParam = new GrMLParameter(this);
          newParam.name = paramFunction.name || 'Input';
          newParam.uuid = paramFunction.uuid; // override id
          this.parameters.push(newParam);
        }
      });
    } else if (this.parameters.length > paramFunctions.length) {
      // Remove obsolte inputs
      this.parameters.forEach((parameters, index) => {
        if (index >= paramFunctions.length) {
          parameters.remove();
        }
      });
      this.parameters = this.parameters.slice(0, paramFunctions.length);
    }

    // update types and names
    this.parameters.forEach((param, i) => {
      param.name = paramFunctions[ i ].name;
      param.type = paramFunctions[ i ].inputType;
    });

    // add missing GrMlOutputFunctions as returnValue
    const defaultModelOutput = this.returnValues[ 0 ];
    const returnValues_ = this.returnValues.slice(1);
    if (returnValues_.length < revalFunctions.length) {
      // Add missing outputs
      revalFunctions.forEach((revalFunction, index) => {
        if (!returnValues_[ index ]) {
          const newRetval = new GrMLReturnValue(this);
          newRetval.name = revalFunction.name || 'Output';
          newRetval.uuid = revalFunction.uuid; // override id
          returnValues_.push(newRetval);
        }
        this.returnValues = [ defaultModelOutput, ...returnValues_ ];
      });
    } else if (this.returnValues.length > revalFunctions.length) {
      // Remove obsolte outputs
      returnValues_.forEach((retVal, index) => {
        if (index >= revalFunctions.length) {
          retVal.remove();
        }
      });
      this.returnValues = [ defaultModelOutput, ...returnValues_.slice(0, revalFunctions.length) ];
    }

    // update types and names
    this.returnValues.forEach((retVal, i) => {
      // for default model output and every function added within the model
      if (i === 0) {
        defaultModelOutput.type = new GrMLType.Model();
        defaultModelOutput.name = 'model';
      } else {
        retVal.type = revalFunctions[ i ].outputType;
        retVal.name = revalFunctions[ i ].name;
      }
    });

    super.update(); // updates the representation

  }
  // public get parameters (): GrMLReturnValue[] {
  //   // parameters are drawn from the model and the contained blocks
  //   throw new Error('TODO: Not implemented');
  // }

  // public get returnValues (): GrMLReturnValue[] {
  //   // parameters are drawn from the model and the contained blocks
  //   throw new Error('TODO: Not implemented');
  // }

  // public serialize(): GrMLFunctionSerialization {
  //   throw new Error('TODO: Not implemented');
  // }

}