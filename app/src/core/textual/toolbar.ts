import { GrMLElement } from "../element";
import { GrMLExecuteFunctionsLocallyMessage, GrMLToolbarCommandEvent, TOOLBAR_COMMANDS } from "../event";
import { stylesheet, template } from "../util";

/**
 * Toolbar for an textual editor
 */
export class GrMLToolbar extends GrMLElement {
  public static TAG_NAME = 'grml-toolbar';

  constructor () {
    super([
      stylesheet`css/grml-toolbar.css`,
      template`
      <div id='toolbar'>
        <span class="group">
        <button id="reset" title='reset function code'>reset cell</button>
        <button id="add" title='add'>+ add</button>
        </span>
        <span class="group">
        <button id="run" title='Execute'>&#9654 run all</button>
        <button id="runCell" title='Execute current cell'>&#9654 run current cell</button>
        </span>
      </div>
    ` ]);

    const runAllButton = this.shadowRoot?.querySelector('#run');
    const runCell = this.shadowRoot?.querySelector('#runCell');
    const resetCellCode = this.shadowRoot?.querySelector('#reset');
    const add = this.shadowRoot?.querySelector('#add');

    runAllButton?.addEventListener('click', () => window.dispatchEvent(new GrMLExecuteFunctionsLocallyMessage(true)));
    runCell?.addEventListener('click', () => window.dispatchEvent(new GrMLExecuteFunctionsLocallyMessage()));
    resetCellCode?.addEventListener('click', () => window.dispatchEvent(new GrMLToolbarCommandEvent(TOOLBAR_COMMANDS.RESET)));
    add?.addEventListener('click', () => window.dispatchEvent(new GrMLToolbarCommandEvent(TOOLBAR_COMMANDS.ADD)));
  }

  public update (): void {
    // do nothing
  }

}