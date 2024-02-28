import { HasParent, UUID } from './element';
import { GrMLModel } from './model';
import {
  GrMLFunctionSerialization,
  GrMLModelFunctionSerialization,
  Serializable,
} from './serializable.interface';
import { GrMLDataType, HasIOTypes, IsExecutable } from './types';
import { GrMLFunctionIO, GrMLParameter, GrMLReturnValue } from './functionIO';
import { GrMLHasProperties, GrMLProperties } from './properties';
import { HasErrors, HasWarnings, NO_DATA_FOUND_RESPONSE, Warning } from './error-reporting';
import { GrMLBootstrapper } from './bootstrapping';
import { GrMLRepresentation, HasCodeRepresentation, HasRepresentation, REPRESENTATION_TYPES, VariousRepresentations } from './representation';
import { GrMLExecuteCodeEvent } from './event';
import { GrMLCodeSnippet } from './textual/code-snippet';
import { GrMLConsole } from './console';

const DEFAULT_ICON = 'img/icons/block.svg';


export interface CanBeSelected {
  selected: boolean;
}

/**
 * Abstract class for GrMLFunctions.
 * Provides access to the functionalities and representations.
 *
 * To instanciate a new class use the function createGrMLFunction(): GrMLFunction
 */
export abstract class GrMLFunction
  implements
  Serializable,
  HasParent<GrMLModel>,
  HasIOTypes,
  GrMLHasProperties,
  HasRepresentation,
  HasWarnings,
  HasErrors,
  IsExecutable,
  CanBeSelected
{
  public static NAME = '';
  public static VERBOSE_NAME = '';
  public static DESCRIPTION = '';
  public static ICON_SRC = DEFAULT_ICON;

  /**
   * Creates a GrMLFunction from a JSON representation.
   *
   * @param obj JSON representation of the function
   * @param parent Parent @see{GrMLModel} if any
   * @returns A function as specified in the input
   */
  public static deserialize (obj: GrMLFunctionSerialization | string, parent?: GrMLModel): GrMLFunction {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }

    if (typeof obj !== 'object') {
      throw new Error('Could not deserialize function.');
    }

    const c = GrMLFunction.lookup(obj.originalName);
    const f = <GrMLFunction> new c(parent);

    if (parent) {
      // set active model as parent
      // (case: active model equals the functions original parent model)
      f.parent = parent;

      // case: currently active model does not equal the functions original model
      if (obj.parentFunctionId && parent?.parent?.uuid !== obj.parentFunctionId) {
        // check if there is any function attached to the model, which is the original parent
        let modelFuncFound = parent.children.find((f) => { (f instanceof GrMLModelFunction) && (f.uuid === (obj as GrMLFunctionSerialization).parentFunctionId); });
        if (!modelFuncFound) {
          // if the currently active model has a parent-model, check its functions
          if (parent.parent?.parent) {
            modelFuncFound = parent.children.find((f) => { (f instanceof GrMLModelFunction) && (f.uuid === (obj as GrMLFunctionSerialization).parentFunctionId); });
          }
        }
        if (modelFuncFound) {
          f.parent = (modelFuncFound as GrMLModelFunction).model;
        } else {
          console.error(`Could not find parent model ${obj.parentFunctionId} of the function ${obj.parentFunctionId}`);
        }
      }
    }
    f.uuid = obj.uuid;

    // deserialze function parameter and returnValues
    obj.parameters.forEach((param, index) => {
      const gParam = f.parameters[ index ];
      gParam.uuid = param.uuid;
      gParam.name = param.name;
      if (param.portName) { gParam.name = param.portName; }
    });
    obj.returnValues.forEach((retVal, index) => {
      const sOutput = f.returnValues[ index ];
      sOutput.uuid = retVal.uuid;
      sOutput.name = retVal.name;
      if (retVal.portName) { sOutput.name = retVal.portName; }
    });

    if (f instanceof GrMLModelFunction) {
      f.model = GrMLModel.deserialize((<GrMLModelFunctionSerialization> obj).model, f);
      f.name = f.model.name;
    }

    // load saved code
    if(obj.code.length > 0){
      (<GrMLCodeSnippet> f.representations[REPRESENTATION_TYPES.CODE]).code = obj.code;
      (<GrMLCodeSnippet> f.representations[REPRESENTATION_TYPES.CODE]).uuid = f.uuid;
    }
    return f;
  }

  /**
   * Creates and returns a new GrMlFunction based on the given tagname.
   *
   * @param newFunction tagname: string
   * @param parameterCount optional
   * @param returnCount optional
   * @returns
   */
  public static lookup (name: string): any {
    const c = GrMLBootstrapper.FUNCTIONS[name];
    if (c) {
      return c;
    }
    throw new Error('Function not found');
  }

  public parent: GrMLModel | null = null;
  public uuid : string = crypto.randomUUID();
  /** Inputs */
  public parameters: GrMLParameter[] = [];
  /** Outputs */
  public returnValues: GrMLReturnValue[] = [];

  public warnings: Warning[] = [ ];
  public errors: string[] = [ ];
  public selected = false;
  public executable = false;
  public codeEditTimestampWhenComputed = new Date(0);
  public codeEditTimestamp = new Date();
  public removable = true;

  protected title = 'generic function';

  /** A set of potential representations. Uses enum values as keys */
  public abstract representations: VariousRepresentations;
  public abstract properties: GrMLProperties;

  /**
   * Creates a new GrMLFunction.
   *
   * @param functionName Name of the function
   * @param parameterCount  Number of input parameters
   * @param returnCount Number of return parameters
   */
  constructor (
    private functionName = '',
    parameterCount = 0,
    returnCount = 0,
    parent?: GrMLModel,
  ) {
    this.parent = parent || null;

    // create new parameters and return values
    // note: array.fill will not work, it just adds object refernces
    for (let i = 0; i < parameterCount; i++) {
      const newParam = new GrMLParameter(this);
      newParam.parent = this;
      this.parameters.push(newParam);
    }

    for (let o = 0; o < returnCount; o++) {
      const newReval = new GrMLReturnValue(this);
      newReval.parent = this;
      this.returnValues.push(newReval);
    }

  }

  public get type (): [ GrMLDataType[], GrMLDataType[] ] {
    return [ this.parameters.map(((i) => i.type)), this.returnValues.map(((o) => o.type)) ];
  }

  public set type (t: [ GrMLDataType[], GrMLDataType[] ]) {
    if (
      t[0].length !== this.parameters.length ||
      t[1].length !== this.returnValues.length
    ) {
      throw new Error('Type annotation does not match I/O port count');
    }
    this.parameters.forEach(((i, n) => i.type = t[0][n]));
    this.returnValues.forEach(((o, n) => o.type = t[1][n]));
  }

  public get name () {
    return this.functionName;
  }

  public set name (n: string) {
    this.functionName = n;
  }

  public addWarning (warn: Warning) {
    // GrMLConsole.log(warn.toString());
    if (!this.warnings.includes(warn)) {
      this.warnings.push(warn);
    }
    this.update();
  }

  public removeWarning (warn: Warning) {
    this.warnings = this.warnings.filter((w) => w !== warn);
    this.update();
  }

  /**
   * Remove all connections from model of the function.
   */
  public removeConnections () {
    this.parameters.forEach((param) => { param.connections.forEach((c) => c.remove()); });
    this.returnValues.forEach((reval) => { reval.connections.forEach((c) => c.remove()); });
  }

  public serialize (): GrMLFunctionSerialization {

    const serialzation: GrMLFunctionSerialization = {
      originalName: (<any> this.constructor).NAME,
      name: this.title,
      uuid: this.uuid,
      properties: Object.fromEntries(
        Object.entries(this.properties)
          .map(([ key, { value } ]) => [ key, value ])
      ),
      parameters: this.parameters.map((i) => ({ name: i.name, uuid: i.uuid })),
      returnValues: this.returnValues.map((o) => ({ name: o.name, uuid: o.uuid })),
      representation: Object.fromEntries(Object.entries(this.representations)
        .map(([ key, value ]) => [ key, (<GrMLRepresentation> value).serialize() ])),
      // Each input 'remembers' the origin function and the start port for each of its incoming connections
      sources:
        this.parameters.map((param) => ({
          data: param.connections?.map((conn) => ({
            startFunc: conn.start?.parent?.uuid || null,
            startFuncReturnIndex: conn.start?.parent?.returnValues.indexOf(conn.start) || null,
          }))
        })),
      // if the function is part of a sequential model, the uuid of the function holding the model is attached
      parentFunctionId: this.parent?.parent?.uuid,
      code: (<GrMLCodeSnippet> this.representations[REPRESENTATION_TYPES.CODE])?.code || '',
    };

    if (!serialzation) {
      throw new Error('Could not serialize function.');
    }

    return serialzation;
  }

  /**
   * Reads and updates properties and code (within code representation)
   * from function serialization to this
   *
   * @param obj function serialization
   */
  public updateAll (obj: GrMLFunctionSerialization): void {
    // TODO: eliminate code dublication (see deserialization)

    // deserialze function parameter and returnValues
    obj.parameters.forEach((param, index) => {
      const gParam = this.parameters[ index ];
      gParam.uuid = param.uuid;
      gParam.name = param.name;
      if (param.portName) { gParam.name = param.portName; }
    });
    obj.returnValues.forEach((retVal, index) => {
      const sOutput = this.returnValues[ index ];
      sOutput.uuid = retVal.uuid;
      sOutput.name = retVal.name;
      if (retVal.portName) { sOutput.name = retVal.portName; }
    });

    // load saved code
    if (obj.code.length > 0) {
      (<GrMLCodeSnippet> this.representations[ REPRESENTATION_TYPES.CODE ]).code = obj.code;
    }

    this.update(); // update view

  }

  public update (): void {
    Object.values(this.representations).forEach((rep) => (<GrMLRepresentation> rep).update());
  }

  public async execute (logFeedback = true) {
    if (logFeedback) {
      GrMLConsole.log(`Function ${this.name} not executable.`);
    }
  }

  public getPortFromUUID (uuid: UUID): GrMLFunctionIO | null {
    // search ports for port with id
    const inputs = this.parameters.find( p => p.uuid === uuid );
    if (inputs) { return inputs; }
    const outputs = this.returnValues.find( P => P.uuid === uuid );
    if (outputs) { return outputs; }
    return null;
  }

  public getCodeSnippetCode (): string {
    let code = '';
    if (Object.hasOwnProperty.call(this.representations, REPRESENTATION_TYPES.CODE)) {
      code = (this.representations[REPRESENTATION_TYPES.CODE] as GrMLCodeSnippet).code;
    }
    return code;
  }

  public inputPortChanged () {
    // TODO: Flo propagate to following blocks (the ones connected to the output ports)
    this.codeEditTimestamp = new Date();
  }

  public getRetValCode (): string {
    let code = '';
    const printRetValsPythonCode: string[] = [];
    this.returnValues.forEach( (retVal) => {
      printRetValsPythonCode.push(`print("{0}: {1}".format('${retVal.name}', ${retVal.name}))`);
    });
    code = printRetValsPythonCode.join('\n');
    return code;
  }

  public data (uuid: string): void | Warning {
    let no_data = false;

    this.parameters.forEach( (param)  => {
      if (param.connections.length) {
        const param_result = param.data(uuid);
        if (param_result instanceof Warning) {
          no_data = true;
          return;
        }
      } else {
        GrMLConsole.log(`Error in ${this.name} block: ${NO_DATA_FOUND_RESPONSE.message}`);
        no_data = true;
        return;
      }
    });

    if (no_data) {
      return NO_DATA_FOUND_RESPONSE;
    }

    window.dispatchEvent(new GrMLExecuteCodeEvent(this.getCodeSnippetCode(), this.getRetValCode(), this, uuid));
  }

  // TODO: Flo edge cases what if oldName was empty '' or newName is empty ''
  public renameVariable (oldName: string, newName: string) {
    this.codeEditTimestamp = new Date();

    const alreadyComputed = this.codeEditTimestampWhenComputed ? this.codeEditTimestampWhenComputed.getMilliseconds() > 0 : false;

    if (oldName !== '' && oldName !== newName && alreadyComputed) {
      const pyCodeChangeVarName = `import copy\n${newName} = copy.deepcopy(${oldName})\ndel ${oldName}`;
      window.dispatchEvent(new GrMLExecuteCodeEvent(pyCodeChangeVarName));
    }
  }

  //public abstract inputPortChanged(): void;
}


export abstract class GrMLModelFunction extends GrMLFunction {

  constructor (tagname: string, public model: GrMLModel, parameterCount = 1, returnValueCount = 1) {
    super(tagname, parameterCount, returnValueCount);
  }

  public get name () {
    if (this.model) {
      return this.model.name;
    } else {
      return 'Unnamed Model';
    }
  }

  public set name (n: string) {
    if (this.model) {
      this.model.name = n;
    }
  }

  public serialize (): GrMLModelFunctionSerialization {
    const serialization = <GrMLModelFunctionSerialization> super.serialize();
    serialization.model = this.model.serialize();
    return serialization;
  }
}

export abstract class GrMLStatelessFunction extends GrMLFunction {

  public data (): void | Warning {
    // TODO: return NO_DATA_FOUND_RESPONSE when input port has no connection, but what to do with it?
    let no_data = false;

    this.parameters.forEach( (param)  => {
      if (!param.connections.length) {
        no_data = true;
      } else {
        param.data();
      }
    });

    if (no_data) {
      GrMLConsole.log(NO_DATA_FOUND_RESPONSE.message);
      return NO_DATA_FOUND_RESPONSE;
    }

    window.dispatchEvent(new GrMLExecuteCodeEvent(this.getCodeSnippetCode(), this.getRetValCode(), this));
  }

}
