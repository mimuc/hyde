import { GrMLLogLevel } from '../../../ext/src/messages';
import { GrMLDataSet } from '../../../ext/src/datasets/datasets';
import { GrMLModel } from './model';
import { GrMLFunction } from './function';
import { UUID } from './element';
import { GrMLConnectionSerialisation } from './serializable.interface';
import { GrMLProperties } from './properties';
import { GrMLConnection, GrMLFunctionIO } from './functionIO';


export enum DRAG_EVENTS {
  CREATE_BLOCK = 'create block',
}
export enum NAME_CHANGE_EVENTS {
  RETURN_VALUE,
  PARAMETER,
  FUNCTION,
}
export enum SELECTION_TYPE {
  ADD,
  CTRL_TRUE,
  SWITCH, // change selection to given f
}
export enum TOOLBAR_COMMANDS {
  ADD,
  RESET,
}

export abstract class GrMLMessage extends MessageEvent<any> {
  constructor (command: string,  data: any = { }) {
    super('message', { data: { command, ...data } });
  }
}

export class GrMLAppReadyMessage extends GrMLMessage {
  public static COMMAND = 'grml-app-ready';
  constructor () {
    super(GrMLAppReadyMessage.COMMAND);
  }
}

export class GrMLFunctionSelectEvent extends GrMLMessage {
  public static COMMAND = 'grml-block-select';
  /**
   * Handles the function selection.
   *
   * Use this event in app instance in which a function is selected.
   * Information will be forwareded to other instances by dispatching a GrMLSelectionChangedEvent.
   *
   * @param func null or the function selected
   * @param addToSelection
   */
  constructor (public func: GrMLFunction | null, public addToSelection: SELECTION_TYPE = SELECTION_TYPE.SWITCH) {
    super(GrMLFunctionSelectEvent.COMMAND);
  }
}

export class GrMLSelectionChangedEvent extends GrMLMessage {
  public static COMMAND = 'grml-function-select-change';
  /**
   * Notifies all other editors to highlight the function representations with same uuids.
   * (But not this application)
   *
   * @param selectedFunctions UUID[]
   */
  constructor (public selectedFunctions: UUID[]) {
    super(GrMLSelectionChangedEvent.COMMAND);
  }
}

export class GrMLPropertiesChangedEvent extends GrMLMessage {
  public static COMMAND = 'grml-properties-change';
  /**
   * Notify other editors, props from function with uuid changed.
   *
   * @param uuid
   * @param properties
   */
  constructor (public uuid: UUID, public properties: GrMLProperties) {
    super(GrMLPropertiesChangedEvent.COMMAND);
  }
}


export class GrMLLibraryItemDragStartEvent extends GrMLMessage {
  public static COMMAND = 'grml-library-item-drag-start';
  constructor (public tag: string) {
    super(GrMLLibraryItemDragStartEvent.COMMAND);
  }
}

export class GrMLBootstrapEvent extends GrMLMessage {
  public static COMMAND = 'grml-bootstrap-complete';
  constructor () {
    super(GrMLBootstrapEvent.COMMAND);
  }
}

export class GrMLHybridBootstrapEvent extends GrMLMessage {
  public static COMMAND = 'grml-textual-bootstrap-complete';
  constructor () {
    super(GrMLHybridBootstrapEvent.COMMAND);
  }
}

export class GrMLModelChangeEvent extends GrMLMessage {
  public static COMMAND = 'grml-model-change';
  constructor (public model: GrMLModel) {
    super(GrMLModelChangeEvent.COMMAND);
  }
}


export class GrMLRemoveEvent extends GrMLMessage {
  public static COMMAND = 'grml-remove';
  constructor (public removeUUID: UUID) {
    super(GrMLRemoveEvent.COMMAND);
  }
}

export class GrMLAddFunctionEvent extends GrMLMessage {
  public static COMMAND = 'grml-add-function';

  /**
   * @param func
   */
  constructor (public func: GrMLFunction) {
    super(GrMLAddFunctionEvent.COMMAND);
  }
}

export class GrMLFunctionChangedEvent extends GrMLMessage {
  public static COMMAND = 'grml-change-function';
  /**
   * @param func the changed function
   */
  constructor (public func: GrMLFunction) {
    super(GrMLFunctionChangedEvent.COMMAND);
  }
}

export class GrMLRepresentationChangeEvent extends GrMLMessage {
  public static COMMAND = 'grml-representation-change';
  constructor () {
    super(GrMLRepresentationChangeEvent.COMMAND);
  }
}

export class GrMLNameChangeEvent extends GrMLMessage {
  public static COMMAND = 'grml-name-change';
  constructor (public eventType: NAME_CHANGE_EVENTS, public uuid: UUID, public name: string, public parentUUID?: UUID) {
    super(GrMLNameChangeEvent.COMMAND);
  }
}

export class GrMLUpdateVariablesMessage extends GrMLMessage {
  public static COMMAND = 'grml-variable-change';
  constructor (public functionIO: GrMLFunctionIO) {
    super(GrMLUpdateVariablesMessage.COMMAND);
  }
}

export class GrMLModelLoadEvent extends GrMLMessage {
  public static COMMAND = 'grml-model-loaded';
  constructor () {
    super(GrMLModelLoadEvent.COMMAND);
  }
}

export class GrMLBlockConnectedEvent extends GrMLMessage {
  public static COMMAND = 'grml-block-connected';
  constructor () {
    super(GrMLBlockConnectedEvent.COMMAND);
  }
}

export class GrMLPortConnectedEvent extends GrMLMessage {
  public static COMMAND = 'grml-port-connected';
  constructor (public connection: GrMLConnectionSerialisation, public connectionReference: GrMLConnection) {
    super(GrMLPortConnectedEvent.COMMAND);
  }
}

export class GrMLLogEvent extends GrMLMessage {
  public static COMMAND = 'grml-log';
  public messages: string[] = [ ];
  constructor (messages: string[], public readonly level: GrMLLogLevel = GrMLLogLevel.LOG) {
    super(GrMLLogEvent.COMMAND);
    this.messages = messages;
  }
}

export class GrMLSubModelSelectedEvent extends GrMLMessage {
  public static COMMAND = 'grml-open-submodel';
  /**
   * Selects and views the opened model. Takes either a model path or an uuid.
   *
   * @param modelPath
   * @param modelUUID
   */
  constructor (public modelPath?: GrMLModel[], public modelUUID?: UUID) {
    super(GrMLSubModelSelectedEvent.COMMAND);
  }
}

export class GrMLRequestDatasetMessaage extends GrMLMessage {
  public static COMMAND = 'grml-data-set-request';
  constructor (public dataset: GrMLDataSet) {
    super(GrMLRequestDatasetMessaage.COMMAND);
  }
}

export class GrMLExecuteFunctionsLocallyMessage extends GrMLMessage {
  public static COMMAND = 'grml-execute-functions';
  /**
  * Execution in textual editor
  */
  constructor (public executeAll: boolean = false) {
    super(GrMLExecuteFunctionsLocallyMessage.COMMAND);
  }
}

export class GrMLToolbarCommandEvent extends GrMLMessage {
  public static COMMAND = 'grml-toolbar-command';
  /**
  * Execution in textual editor
  */
  constructor (public command: TOOLBAR_COMMANDS) {
    super(GrMLToolbarCommandEvent.COMMAND);
  }
}
export class GrMLExecuteCodeEvent extends GrMLMessage {
  public static COMMAND = 'execute-code';
  public codeEditTimestampWhenAdded: Date;

  constructor (public codeSnippet: string, public retValCode: string = '', public grmlFunction: GrMLFunction | undefined = undefined, public uuid: string = crypto.randomUUID()) {
    super(GrMLExecuteCodeEvent.COMMAND);
    this.codeEditTimestampWhenAdded = grmlFunction ? grmlFunction.codeEditTimestamp : new Date();
  }
}
