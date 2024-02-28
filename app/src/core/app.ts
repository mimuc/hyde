import { stylesheet } from './util';
import { GrMLElement, UUID } from './element';
import {
  SELECTION_TYPE,
  GrMLAppReadyMessage,
  GrMLModelLoadEvent,
  GrMLSelectionChangedEvent,
  GrMLSubModelSelectedEvent,
  NAME_CHANGE_EVENTS,
} from './event';
import { GrMLVSCHandler } from '../vsc/message-handler';
import {
  GrMLCoreMessageHandler,
  GrMLMessageHandler,
} from './message-handler';
import { GrMLModel } from './model';
import { GrMLModelBreadcrumb } from './breadcrumb';
import { GrMLPipelineModel } from '../models/pipeline';
import { GrMLFunction, GrMLModelFunction } from './function';
import { GrMLWebsocketMessageHandler } from '../vsc/websocket-handler';
import { GrMLConnectionSerialisation } from './serializable.interface';
import { REPRESENTATION_TYPES } from './representation';
import { GrMLConnection, GrMLParameter, GrMLReturnValue } from './functionIO';
import { GrMLCodeSnippet } from './textual/code-snippet';
import { GrMLConnectionRepresentation } from './graphical/ports';
import { GrMLBlock } from './graphical/blocks';


/**
 * The primary GrML application. Emvedding this into a HTML document sets up
 * the GrML editors and blocks. Also provides bootstrapping functionality.
 */
export class GrMLApplication extends GrMLElement {
  public static TAG_NAME = 'grml-app';

  public readonly breadcrumb: GrMLModelBreadcrumb = <GrMLModelBreadcrumb> document.createElement(GrMLModelBreadcrumb.TAG_NAME);
  private selectedFunctions: GrMLFunction[] = [];
  private currentlyActiveModel: GrMLModel;

  private wrapper = (() => {
    const main = document.createElement('main');
    main.classList.add('active-editor');
    return main;
  })();

  constructor (public model: GrMLModel = new GrMLPipelineModel(), styles: Node[] = [ ]) {
    super([
      stylesheet`css/grml-app.css`,
      ...styles
    ]);

    this.currentlyActiveModel = model;
    if (model instanceof GrMLPipelineModel) {
      // enable breadcrumb in graphical editor
      this.shadowRoot?.appendChild(this.breadcrumb);
      // load name of model at start
      this.breadcrumb.path = [ this.model ];
    }
    this.shadowRoot?.appendChild(this.wrapper);
    this.wrapper.appendChild(this.currentlyActiveModel.editor);

    const handlers: GrMLMessageHandler[] = [
      new GrMLVSCHandler(this),
      new GrMLCoreMessageHandler(this),
      new GrMLWebsocketMessageHandler(this),
    ];
    window.addEventListener('message', (message) => handlers.forEach((handler) => {
      if (message instanceof MessageEvent) {
        handler.handle(message);
      }
    }));
    window.dispatchEvent(new GrMLAppReadyMessage());
  }

  public get activeRepresentation (): REPRESENTATION_TYPES {
    return this.editor.REPRESENTATION_TYPE;
  }

  /**
   * The current primary editor instance that is being displayed.
   */
  public get editor () {
    return this.activeModel.editor;
  }

  /**
   * The active model is the model that is currently displayed in the primary
   * editor panel. It should be a descendant model of the `model` of the
   * current app instance.
   */
  public get activeModel () {
    return this.currentlyActiveModel;
  }

  /**
   * Updating the currently active model in turn also updates the current editor
   * view to provide an approrpiate editor for the new model.
   */
  public set activeModel (model: GrMLModel) {
    window.dispatchEvent(new GrMLSelectionChangedEvent([])); // de-select all functions

    if (this.activeRepresentation === REPRESENTATION_TYPES.BLOCK) {
      const previousEditor = this.editor;
      previousEditor.parentElement?.replaceChild(model.editor, previousEditor);
      model.editor.update();
    } else if (this.activeRepresentation === REPRESENTATION_TYPES.CODE) {
      // remove active status from former active functions
      this.currentlyActiveModel.children.forEach((f) => {
        (<GrMLCodeSnippet>f.representations[REPRESENTATION_TYPES.CODE])?.classList.add('disabled');
        (<GrMLCodeSnippet>model.parent?.representations[REPRESENTATION_TYPES.CODE])?.classList.remove('open');
      });
      // add active status to newly active functions
      model.children.forEach((f) => {
        (<GrMLCodeSnippet>f.representations[REPRESENTATION_TYPES.CODE])?.classList.remove('disabled');
      });
      (<GrMLCodeSnippet>model.parent?.representations[REPRESENTATION_TYPES.CODE])?.classList.remove('disabled');
      (<GrMLCodeSnippet>model.parent?.representations[REPRESENTATION_TYPES.CODE])?.classList.add('open');
    }
    this.currentlyActiveModel = model;
  }

  public onInit () {
    console.log('Init graphical app');
    this.model.editor.update();
  }

  public executeFunctions (executeAll = false){
    if(executeAll){
      this.activeModel.children.forEach((func) => func.execute(false));
    } else {
      this.selectedFunctions.forEach((func) => func.execute());
    }
  }

  public resetSelectedFunctions (){
    this.selectedFunctions.forEach((func) => (<GrMLCodeSnippet> func.representations[REPRESENTATION_TYPES.CODE]).reset());
  }

  // Interaction handling

  /**
   * Handler for when a completely new model is received to replace the old one.
   * Needed, when a new model is loaded from file.
   *
   * @param {GrMLModel} model The new model
   */
  public onNewModel (model: GrMLModel) {
    this.model = model;
    this.activeModel = model;
    this.breadcrumb.path = [ this.model ];
    window.dispatchEvent(new GrMLModelLoadEvent()); // update editor
  }


  /**
   * Handler for whenever a function is selected, e.g. by clicking at it
   *
   * @param {GrMLRepresentation} selectedFunction The selected function
   * @param addToSelection
   * @param raiseEvent false if other editors should not be notified
   * @returns
   */
  public onFunctionSelect (selectedFunction: GrMLFunction | null, addToSelection = SELECTION_TYPE.SWITCH, raiseEvent = true) {
    if (!selectedFunction) {
      this.model.children.forEach((f) => f.selected = false);
      this.activeModel.children.forEach((f) => f.selected = false);
      this.selectedFunctions = [ ];
      // hide props and update highlighting
      this.activeModel.editor.onSelect(null);
      this.activeModel.editor.update();
      window.dispatchEvent(new GrMLSelectionChangedEvent([ ])); // notify other editors
      return;
    }

    const indexOfSelected = this.selectedFunctions.indexOf(selectedFunction);

    if (indexOfSelected > -1) {
      // if function was already selected and the 'ctrl' key is pressed, deselect
      if (addToSelection === SELECTION_TYPE.CTRL_TRUE) {
        this.selectedFunctions.forEach((f) => f.selected = false); // remove selected status
        this.selectedFunctions.splice(indexOfSelected, 1); // remove function from selection
        if (this.selectedFunctions.length > 0) {
          this.selectedFunctions.forEach((f) => f.selected = true);
        }
        // hide props
        this.activeModel.editor.onSelect(null);
      } else {
        // do nothing, as same function was selected again, and no key is pressed
        return;
      }
    } else {
      // select a function and de-select all other ones
      if (addToSelection === SELECTION_TYPE.SWITCH) {
        this.selectedFunctions.forEach(f => f.selected = false); // remove selected status
        this.selectedFunctions = [ selectedFunction ];
      } else {
        // case SELECTION_TYPE.ADD:
        this.selectedFunctions.push(selectedFunction);
      }
      this.selectedFunctions.forEach((f) => f.selected = true);
      // show props
      this.activeModel.editor.onSelect(selectedFunction);
    }
    // Update editor to show highlighting.
    this.activeModel.editor.update();

     // if the function is newly added, other editors do not need to be notified
    if (raiseEvent) {
      window.dispatchEvent(new GrMLSelectionChangedEvent(this.selectedFunctions.map(func => func.uuid))); // notify other editors
    }
  }


  public setFunctionsSelectedByUUID (uuids: UUID[]) {
    // remove selection
    this.model.children.forEach((f) => f.selected = false);
    this.activeModel.children.forEach((f) => f.selected = false);
    uuids.forEach((uuid, index) => {
      // highlight function and add to list of selected ones
      const addToSelection = this.activeModel.getFunctionFromUUID(uuid);

      addToSelection.selected = true; // highlight
      this.selectedFunctions.push(addToSelection);

      // show props for the last selected function
      if (index + 1 >= uuids.length) {
        this.activeModel.editor.onSelect(addToSelection);
      }
    });

    this.editor.update();
  }


  /**
   * Adds a serialized connection to model and view.
   *
   * @param connection a serialized connection
   */
  public addConnection (connection: GrMLConnectionSerialisation | GrMLConnection) {

    if (connection instanceof GrMLConnection) {
      // update other functions
      if(connection.start){
        this.subsequentlyChangeVariableNames(connection.start);
      }
      // update the view of each function to show new varaiable names
      this.activeModel.children.forEach((f) => f.update());
    } else {
      // add the connection to the model and update the view

      const recreatedConnection = this.addConnectionSerialisation(connection); // add connection to model
      // show the connection on code-representation-side
      if (this.activeRepresentation === REPRESENTATION_TYPES.CODE) {
        if (recreatedConnection && recreatedConnection.start && recreatedConnection.end) {

          // if connection has a associated function with a representation
          if (recreatedConnection.end.parent) {
            this.editor.updateConnections(recreatedConnection.start.parent); // update the view

            // starting from the recreated connection start: change variable names and update view
            this.subsequentlyChangeVariableNames(recreatedConnection.start);
          }
        }
      }

      if (this.activeRepresentation === REPRESENTATION_TYPES.BLOCK) {
        // add the connection to the GP view

        // create a connection representation based on the deserialized connection
        const connectionRepresentation = new GrMLConnectionRepresentation();
        connectionRepresentation.start = ( <GrMLBlock> recreatedConnection.start?.parent.representations[REPRESENTATION_TYPES.BLOCK]).outputs.find((o) => o.parentParam === recreatedConnection.start);
        connectionRepresentation.end = ( <GrMLBlock> recreatedConnection.end?.parent.representations[REPRESENTATION_TYPES.BLOCK]).inputs.find((i) => i.parentParam === recreatedConnection.end);
     
        // Add connection to list of connections of the output and input port
        connectionRepresentation.start?.connections.push(connectionRepresentation);
        connectionRepresentation.end?.connections?.push(connectionRepresentation);
        // Add to DOM
        (<GrMLBlock> recreatedConnection.start?.parent.representations[REPRESENTATION_TYPES.BLOCK]).parentElement?.appendChild(connectionRepresentation);
        connectionRepresentation.updatePosition();
      }
    }
  }

  /**
   * Takes a deserialized function, already contained within model.
   * Applies the changed variable name to view and model.
   *
   * @param changedFunction function with changed variable name
   */
  public renameVariable (changeType: NAME_CHANGE_EVENTS, uuid: UUID, newName: string, parentUUID?: UUID) {
    if (changeType === NAME_CHANGE_EVENTS.RETURN_VALUE || changeType === NAME_CHANGE_EVENTS.PARAMETER) {
      if (parentUUID) {
        const functionIndex: number = this.model.children.findIndex((func: GrMLFunction) => func.uuid === parentUUID);
        const functionRef = this.model.children[ functionIndex ]; // function to be overwritten
        const changedFunctionIO = functionRef.getPortFromUUID(uuid);
        if (changedFunctionIO) {
          this.model.removeVariable(changedFunctionIO.name);
          this.model.addVariable(newName, changedFunctionIO.type);
          changedFunctionIO.name = newName;
          this.editor.update(); // update view of directly affected function first
          if (changeType === NAME_CHANGE_EVENTS.RETURN_VALUE) {
            this.subsequentlyChangeVariableNames(changedFunctionIO as GrMLReturnValue); // update the view of all other functions
          }
          return; // only one portname can be changed each time
        } else {
          throw new Error('Missing uuid of parent function to rename port');
        }
      } else {
        // if (changeType === NAME_CHANGE_EVENTS.FUNCTION)
        // TODO change name of function
        throw new Error('Change name of function is not implemented.');
      }
    }
  }


  /**
   * Handler for whenever the `Delete` key is pressed.
   */
  public onDelete () {
    if (this.activeModel) {
      this.selectedFunctions.forEach((f) => {
        if (f.removable) {
          this.activeModel.removeFunction(f);
        }
      });
    }
  }

  /**
   * This function updates which Sub/Model is currently being display
   * @param modelPath List of nested models, the last of which is the currently viewed
   */
  public openSubmodelEditor ({ modelPath, modelUUID }: GrMLSubModelSelectedEvent | { modelPath?: undefined, modelUUID: UUID; }) {
    this.selectedFunctions = [];

    if (modelPath) {
      // if the model was selected in this instance
      this.breadcrumb.path = modelPath;

      if (modelPath.length) {
        const model = modelPath[ modelPath.length - 1 ];
        if (model instanceof GrMLModel) {
          this.activeModel = model;
        }
      } else {
        this.activeModel = this.model;
      }
    } else if (modelUUID) {
      // if the model was selected in another instance and is not the applications parent model
      const modelFuncFound = this.model.children.find((f) =>
        (f instanceof GrMLModelFunction && f.uuid === modelUUID)
      );
      if (modelFuncFound) {
        this.activeModel = (modelFuncFound as GrMLModelFunction).model;
      } else {
        throw new Error('Could not open submodel in editor. Submodel not defined.');
      }
    } else {
      // if the model was selected in another instance and is the applications parent model
      this.activeModel = this.model;
    }
  }

  // public onGroup () {
  //   if (this.selectedFunctions.length > 1) {
  //     //TODO: filter undefined
  //     const functionRepresentations: GrMLRepresentation[] = <GrMLRepresentation[]> this.selectedFunctions.map(f => f.representations[this.representationType]).filter(Boolean);
  //     this.editor.onGroup(functionRepresentations);
  //     this.onFunctionSelect(null);
  //     this.editor.update();
  //   }
  // }

  // public onDuplicate () {
  //   if (this.selectedFunctions.length > 1) {
  //     //TODO: filter undefined
  //     const functionRepresentations: GrMLRepresentation[] = <GrMLRepresentation[]>  this.selectedFunctions.map(f => f.representations[this.representationType]).filter(Boolean);
  //     this.editor.onDuplicate(functionRepresentations);
  //     this.editor.update();
  //   }
  // }

  public update () {
    return this.activeModel.editor.update();
  }

  /**
   * Subsecently checks for connections in model and switches the variable names.
   * Only if they do not already have a new variable name.
   *
   * @param retVal port with changed name
   */
  public subsequentlyChangeVariableNames (retVal: GrMLReturnValue) {
    let newVariableName: string;
    // if there is a connection outgoing from the port and the port has a name
    if (retVal.connections.length > 0 && retVal.name.length > 0) {
      newVariableName = retVal.name; // new name
      // for each connection update the functions connected to the end
      retVal.connections.forEach((connection: GrMLConnection) => {
        const parameter = connection.end;
        if (parameter) {
          const oldName = parameter.name;
          parameter.name = newVariableName; // override name of parameter with new name of the variable
          // if the function has return values with the same type change their variable names
          // and than change the names of their connections
          if (connection.end?.parent && connection.end?.parent.returnValues.length > 0) {
            const furtherReturnValues = connection.end?.parent.returnValues.filter((reVal) => (reVal.type.type === parameter.type.type));
            furtherReturnValues.forEach((r) => {
              // change name if the return value has not been named
              if(r.name === '' || r.name === oldName){ // r.connections.length > 0 &&
                r.name = newVariableName;
              this.subsequentlyChangeVariableNames(r);
              }
            });
          }
        }
      });
      this.editor.update();
    }
  }

  /**
   * Deserializes and adds a connection to the model.
   * (**not** to the view.)
   *
   * @param connection serialisation of the connection
   */
  private addConnectionSerialisation (connection: GrMLConnectionSerialisation): GrMLConnection {
    const recratedConnection = new GrMLConnection();
    // Recreate InputPort
    if (connection.paramFuncId && connection.paramId && connection.returnValueId && connection.returnValueFuncId) {
      const parameterFunc = this.model.getFunctionFromUUID(connection.paramFuncId);
      const parameterI: GrMLParameter = parameterFunc.getPortFromUUID(connection.paramId) as GrMLParameter;
      const returnFunc = this.model.getFunctionFromUUID(connection.returnValueFuncId);
      const returnPortO: GrMLReturnValue = returnFunc.getPortFromUUID(connection.returnValueId) as GrMLReturnValue;

      if (parameterFunc && parameterI && returnFunc && returnPortO) {
        // add ports to connection
        recratedConnection.start = returnPortO;
        recratedConnection.end = parameterI;
        // add connection to ports
        parameterI.connections.push(recratedConnection);
        returnPortO.connections.push(recratedConnection);
        return recratedConnection; // finished recreation
      } else {
        throw new Error('Could not deserialize connection. At least one associated function or port is missing within model.');
      }
    }
    throw new Error(`Could not deserialize connection. Missing information. \n
              InputFunction: ${connection.paramFuncId},
              Parameter: ${connection.paramId},
              ReturnValue: ${connection.returnValueId},
              OutputFunction: ${connection.returnValueFuncId}`);
  }
}
