import { GrMLHybridApplication } from '../hybrid/core/text-app';
import { GrMLCustomFunction } from '../hybrid/models/functions/custom';
import { GrMLApplication } from './app';
import {
  GrMLBootstrapEvent,
  GrMLFunctionSelectEvent,
  GrMLLogEvent,
  GrMLMessage,
  GrMLSubModelSelectedEvent,
  GrMLModelLoadEvent,
  GrMLRepresentationChangeEvent,
  GrMLAddFunctionEvent,
  SELECTION_TYPE,
  GrMLExecuteFunctionsLocallyMessage,
  GrMLToolbarCommandEvent,
  TOOLBAR_COMMANDS,
  GrMLPortConnectedEvent,
  GrMLUpdateVariablesMessage,
} from './event';

export interface GrMLMessageHandler {
  handle (m: GrMLMessage): any;
}

/**
 * Handles events and delegates them either back to the application or to the host vsc instance.
 */
export class GrMLCoreMessageHandler implements GrMLMessageHandler {
  constructor (
    private app: GrMLApplication | GrMLHybridApplication,
  ) {
    document.addEventListener('keyup', (e) => this.keyboardHandler(e));
  }

  handle (m: GrMLMessage): any {
    switch (m.data.command) {
      case GrMLBootstrapEvent.COMMAND: {
        return this.app.onInit();
      }
      case GrMLFunctionSelectEvent.COMMAND:
        return this.app.onFunctionSelect(
          (<GrMLFunctionSelectEvent> m).func, // function holding the representation
          (<GrMLFunctionSelectEvent> m).addToSelection
        );
      case GrMLSubModelSelectedEvent.COMMAND: return this.app.openSubmodelEditor(<GrMLSubModelSelectedEvent> m);
      case GrMLLogEvent.COMMAND: return console.info(...(<GrMLLogEvent> m).messages);
      case GrMLRepresentationChangeEvent.COMMAND: return this.app.editor.update();
      case GrMLModelLoadEvent.COMMAND: return this.app.editor.update();
      case GrMLAddFunctionEvent.COMMAND: return this.app.onFunctionSelect((<GrMLAddFunctionEvent> m).func, SELECTION_TYPE.SWITCH, false); // select function added for the current editor
      case GrMLExecuteFunctionsLocallyMessage.COMMAND: return this.app.executeFunctions((<GrMLExecuteFunctionsLocallyMessage> m).executeAll);
      case GrMLPortConnectedEvent.COMMAND: return this.app.addConnection((<GrMLPortConnectedEvent> m).connectionReference);
      case GrMLUpdateVariablesMessage.COMMAND: return this.app.subsequentlyChangeVariableNames((<GrMLUpdateVariablesMessage> m).functionIO);
      case GrMLToolbarCommandEvent.COMMAND:
        switch ((<GrMLToolbarCommandEvent> m).command) {
          case TOOLBAR_COMMANDS.ADD:
            this.app.activeModel.addFunction(GrMLCustomFunction.VERBOSE_NAME);
            break;
          case TOOLBAR_COMMANDS.RESET:
            this.app.resetSelectedFunctions();
            break;
        }
        return;
      default: return null;
    }
  }

  /**
   * Delegates keyboard actions
   *
   * @param e {KeyboardEvent}
   */
  public keyboardHandler (e: KeyboardEvent) {
    console.info(`%c${e.ctrlKey ? 'Ctrl + ' : ''}${e.shiftKey ? 'Shift + ' : ''}${e.key}`, 'padding:.25rem .5rem;display:inline-block;color:black;font-family:monospace;background:#dddddd;border:thin solid black;border-radius:4px;');
    switch (e.key) {
      case 'Delete':
        return this.app.onDelete();
      case 'ArrowUp': break; // TODO: navigate cells in textual editor
      case 'ArrowDown': break;
      case 'G': {
        if (e.shiftKey) {
          // this.app.onGroup();
        }
      }
        break;
    }
  }

}