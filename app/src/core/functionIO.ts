import { HasUUID } from './element';
import { HasWarnings, NO_DATA_FOUND_RESPONSE, Warning } from './error-reporting';
import { GrMLFunction } from './function';
import { GrMLConnectionRepresentation } from './graphical/ports';
import { GrMLConnectionSerialisation } from './serializable.interface';
import { GrMLDataType, GrMLType, HasType } from './types';

declare const crypto: any;

/**
 * Resembles values and parameters of a function.
 * @see {GrMLFunction}
 */
export abstract class GrMLFunctionIO implements HasType, HasUUID, HasWarnings {
  public connections: GrMLConnection[] = [];
  public warnings: Warning[] = [];
  private _uuid = crypto.randomUUID();
  private portName = '';
  private dataType: GrMLDataType = GrMLType.None;


  constructor (public parent: GrMLFunction) { }

  public get name (): string {
    return this.portName; // attributes just exists if port is added to DOM, therefore classvariable is used
  }

  public set name (name: string) {
    this.portName = name;
  }

  public get type (): GrMLDataType {
    return this.dataType;
  }

  public set type (t: GrMLDataType) {
    this.dataType = t;
  }

  public get uuid (): string {
    return this._uuid;
  }

  public set uuid (uuid: string) {
    this._uuid = uuid;
  }


  public warn (warning: Warning) {
    if (!this.warnings.includes(warning)) {
      this.warnings.push(warning);
    }
    // update view
    this.parent.update();
  }

  /**
   * Deletes all associated connections.
   */
  public remove () {
    // Remove all connections
    this.connections.forEach((c) => c.remove());

    // remove self
    if(this instanceof GrMLParameter){
      const ownIndex = this.parent.parameters.indexOf(this);
      this.parent.parameters.splice(ownIndex, 1);
    } else if (this instanceof GrMLReturnValue) {
      const ownIndex = this.parent.returnValues.indexOf(this);
      this.parent.returnValues.splice(ownIndex, 1);
    }

  }

  public abstract data (uuid: string): void | Warning;

}

export class GrMLParameter extends GrMLFunctionIO {

  public data (uuid: string): void | Warning {
    if (this.connections.length > 0) {
      const start = this.connections[ 0 ].start;
      if (start) {
        return start.data(uuid);
      } else {
        return NO_DATA_FOUND_RESPONSE;
      }
    }
    return NO_DATA_FOUND_RESPONSE;
  }

}

export class GrMLReturnValue extends GrMLFunctionIO {

  /**^
* @returns Data from parent block
*/
  public data (uuid: string): void | Warning {
    if (this.parent) {
      const index = this.parent.returnValues.indexOf(this);
      if (this.parent.returnValues.length >= index) {
        return this.parent.data(uuid);
      }
    }
    return NO_DATA_FOUND_RESPONSE;
  }

}

/**
 * Data of a single connection between exactly one {@link GrMLParameter} of a function
 * and exactly one {@link GrMLReturnValue}.
 */
export class GrMLConnection {
  public start?: GrMLReturnValue;
  public end?: GrMLParameter;
  private _representation?: GrMLConnectionRepresentation; // reference to the representation if existent

  constructor (representation?: GrMLConnectionRepresentation) {
    this._representation = representation || undefined;
  }

  public set representation (representation: GrMLConnectionRepresentation) {
    this._representation = representation;
  }

  public serialize (): GrMLConnectionSerialisation {
    return { paramFuncId: this.end?.parent?.uuid, paramId: this.end?.uuid, returnValueId: this.start?.uuid, returnValueFuncId: this.start?.parent?.uuid };
  }

  /**
   * Removes a connection from the model.
   *
   * TODO: Trigger an update instead to remove the connecion from the view.
   */
  public remove () {

    // remove connection from view
    if (this._representation){
      this._representation.remove();
    }

    // remove connection from model
    this.start?.connections.splice(this.start?.connections.indexOf(this), 1);
    this.end?.connections.splice(this.end?.connections.indexOf(this), 1);
  }

}