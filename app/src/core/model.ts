import { GrMLEditor } from './editor';
import { GrMLAddFunctionEvent, GrMLRemoveEvent, GrMLRepresentationChangeEvent } from './event';
import { GrMLBootstrapper } from './bootstrapping';
import { HasParent, HasPath, UUID } from './element';
import { GrMLFunction, GrMLModelFunction } from './function';
import { GrMLModelSerialization, Serializable } from './serializable.interface';
import { GrMLRepresentation } from './representation';
import { GrMLHybridTextEditor } from '../hybrid/models/text-editor';
import { GrMLDataType } from './types';
import { GrMLConsole } from './console';
import { GrMLCodeSnippet } from './textual/code-snippet';

export interface GrMLHasEditor {
  editor: GrMLEditor<GrMLModel>
}

/**
 * Abstract class representing a generic GrML model.
 * A model consists of:
 * * a name
 * * a series of potentially interconnected functions
 * * an editor to modify the model via their representations
 */
export abstract class GrMLModel implements Serializable, GrMLHasEditor, HasPath<GrMLModel>, HasParent<GrMLFunction> {
  public static TYPE = 'UNSPECIFIED MODEL';

  /**
   * Creates a model from a JSON representation
   *
   * @param obj The JSON representation of the model
   * @param parent if this is a model contained in a @see{GrMLModelBlock}, this is the parent block
   * @returns The model as represented by the input
   */
   public static deserialize (obj: GrMLModelSerialization | string, parent?: GrMLFunction): GrMLModel {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }

    if (typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Could not deserialize model.');
    }

    const modelType = obj.type;
    const modelConstructor = GrMLBootstrapper.MODELS[modelType];
    if (modelConstructor) {
      const model = new modelConstructor([ ]);
      const functions = obj.children.map((f: any) => GrMLFunction.deserialize(f, model));
      model.children = functions;
      model.name = obj.name;
      model.parent = parent || null;

      // override editor in text-app
      if (parent?.parent?.editor instanceof GrMLHybridTextEditor) {
        model.editor = parent?.parent?.editor;
      }

      // currently not needed: GrMLModel.recreateConnections(model);
      model.editor.update();
      return model;
    }

    throw new Error('Could not deserialize model.');
  }


  // /**
  //  * When a model is deserialized, the @see{GrMLConnection}s can only be created
  //  * once all blocks are restored. This function takes this partially restored
  //  * model and recreates the connections between the blocks.
  //  *
  //  * @param {GrMLModel} model The partially restored model
  //  */
  // private static recreateConnections (model: GrMLModel) {
  //   throw new Error('Not implemented');
  // }


  public parent: GrMLModelFunction | null = null;
  public children: GrMLFunction[] = [ ];
  private variables: { [ name: string ]: { type: GrMLDataType; }; } = {};

  public abstract name: string;
  public abstract editor: GrMLEditor<GrMLModel>;

  public get path (): GrMLModel[] {
    if (this.parent) {
      return [ ...(this.parent?.parent?.path || [ ]), this ];
    } else {
      return [ this ];
    }
  }

  public getVariableFromName (name: string) {
    return (this.variables[ name ]);
  }

  /**
   * Adds a variable to the model (if it does not exist)
   *
   * @param name of the variable
   * @param datatype
   * @returns name as string
   */
  public addVariable (name: string, datatype: GrMLDataType): string | undefined {
    const variable = this.getVariableFromName(name);

    if(!variable){
      // add varaiable
      this.variables[ name ] = { type: datatype };
    }
    return name;
  }

  /**
   * Removes a variable from the model, only if it is not used within any child-function
   *
   * @param name of the variable
   */
  public removeVariable (name: string) {
    let varUsed = false; // true if variable is still used within another function in this model

    this.children.forEach((f) => {
      if (f.returnValues.find((r) => r.name === name)) { varUsed = true; }
    });
    if (!varUsed) {
      if (this.getVariableFromName(name)) {
        delete this.variables[ name ];
      } else {
        console.error(`Variable with name ${name} does not exist in this model.`);
      }
    }
  }

  /**
   * Adds a GrMLFunction to the model, sends to server and notifies that the model changed.
   *
   * @param blocktype either the grml blocktype or a grmlFunction
   * @param properties
   * @param raiseEvent
   * @returns GrMLFunction containing the representations
   */
  public addFunction (f: GrMLFunction | string, properties: { [prop: string]: any} = { }, raiseEvent = true) : GrMLFunction {

    const func = (typeof f === 'string') ? new (GrMLFunction.lookup(f))(this) : f;
    func.parent = func.parent ?? this; // set parent if it is not already set

    for (const prop in properties) {
      func.properties[prop] = properties[prop];
    }

    this.children.push(func);

    if (raiseEvent) {
      // Notify app to select function, and send function to other editors
      window.dispatchEvent(new GrMLAddFunctionEvent(func));
    }

    Object.values(func.representations).forEach((rep) => (<GrMLRepresentation> rep).update());
    // After the new function is added: notify view
    window.dispatchEvent(new GrMLRepresentationChangeEvent());

    return func;
  }


  /**
   * Removes a function from the model.
   *
   * Deletes all its connections. removes the variables.
   *
   * @param functionToRemove function to be removed
   * @returns
   */
  public removeFunction (functionToRemove: GrMLFunction | string) {
    let functionIndex: number;
    if (typeof functionToRemove !== 'string') {
      functionIndex = this.children.indexOf(functionToRemove);
      window.dispatchEvent(new GrMLRemoveEvent(functionToRemove.uuid)); // notify other editors to remove the function
    } else {
      functionIndex = this.children.findIndex((f) => (f.uuid === functionToRemove));
    }

    // remove function and update view
    if (functionIndex > -1) {
      const funcToBeRemoved = this.children[ functionIndex ];
      // remove all existing connections
      this.children[ functionIndex ].removeConnections();
      // if the function has a model, remove all chridren and their connections
      if (funcToBeRemoved instanceof GrMLModelFunction) {
        funcToBeRemoved.model.children.forEach((f) => (this.removeFuncAndConnections(f)));
      }
      this.children.splice(functionIndex, 1); // remove self
      this.removeAllVariablesDefinedInFunction(funcToBeRemoved);
      this.editor.onSelect(null); // hide props
      window.dispatchEvent(new GrMLRepresentationChangeEvent());
    } else {
      // function not yet found, search through sub-models
      this.children.forEach((f) => {
        if (f instanceof GrMLModelFunction){
          functionIndex = f.model.children.findIndex((f) => (f.uuid === functionToRemove));
          if(functionIndex > -1){
            const funcRemoved = f.model.children[functionIndex];
            f.model.children.splice(functionIndex, 1);
            f.model.removeAllVariablesDefinedInFunction(funcRemoved);
            f.model.removeFuncAndConnections(f.model.getFunctionFromUUID(<string> functionToRemove));
            this.editor.onSelect(null); // hide props
            window.dispatchEvent(new GrMLRepresentationChangeEvent());
            return;
          }
        }
      });
    }
  }


  /** Transforms this model into a serializable format */
  public serialize (): GrMLModelSerialization {
    const modelSerialization : GrMLModelSerialization = {
      name: this.name,
      type: (<typeof GrMLModel> this.constructor).TYPE,
      children: this.children.map((f) => f.serialize()),
      parentId: this.parent?.uuid
    };
    return modelSerialization;
  }


  /** Returns the first function with the matching uuid */
  public getFunctionFromUUID (uuid: UUID, model?: GrMLModel): GrMLFunction {
    const children = model ? model.children : this.children;
    let funcFound = children.find(func => func.uuid === uuid);
    if (funcFound) {
      return funcFound;
    }
    // search for function in sub-models
    let func: GrMLFunction | undefined;

    children.forEach((f) => {
      if (f instanceof GrMLModelFunction){
        const result = this.getFunctionFromUUID(uuid, f.model);
        if (result) {
          func = result;
        }
      }
    });

    if (!func) {
      throw new Error('Could not find function in model.');
    }
    return func;

  }

   /** Checks if the function exists within the model */
   public doesFunctionExist (uuid: UUID, model?: GrMLModel): boolean {
    const children = model ? model.children : this.children;

    let funcFound = children.find(func => func.uuid === uuid) ? true : false;
    if (funcFound) {
      return true;
    }

    // search for function in sub-models
    children.forEach((f) => {
      if(f instanceof GrMLModelFunction){
        const funcFoundInChild = this.doesFunctionExist(uuid, f.model);
        if (funcFoundInChild) {
          funcFound = true;
        }
      }
    });
    if (funcFound) {
      return true;
    }

    return false;
  }

   /**
   *
   * @param func function to be removed
   */
   private removeFuncAndConnections (func: GrMLFunction) {
    func.removeConnections();
    const functionIndex = this.children.indexOf(func);
    this.children.splice(functionIndex, 1);
  }

  /**
   * Removes return values of a function (= variables defined in function) from model
   * Only if variables are not used as return values in another function.
   *
   * @param func
   */
  private removeAllVariablesDefinedInFunction (func: GrMLFunction) {
    func.returnValues.forEach((reval) => this.removeVariable(reval.name));
  }

  public abstract update (): void;

}
