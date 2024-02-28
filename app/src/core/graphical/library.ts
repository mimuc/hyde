import {
  template,
  stylesheet,
} from '../util';
import { GrMLElement } from '../element';
import {
  DRAG_EVENTS,
  GrMLLibraryItemDragStartEvent,
} from '../event';
import { GrMLTooltip } from '../../elements/tooltip';
import { GrMLFunction } from '../function';

export class GrMLBlockLibrary extends GrMLElement {
  public static TAG_NAME = 'grml-block-library';
  public static MISC_LABEL = 'Misc';

  public readonly AVAILABLE_BLOCKS: { [category: string]: { [name: string]: () => GrMLFunction } } = { };

  constructor () {
    super([
      stylesheet`css/grml-library.css`,
      template`
      <div id='library'>
        <h3>Library</h3>
        <input type='search' placeholder='Search...'>

      </div>
    ` ]);

    setTimeout(() => this.update());
  }

  public register (func: any, category: string | number = GrMLBlockLibrary.MISC_LABEL): void {
    if (typeof category === 'string') {
      if (!this.AVAILABLE_BLOCKS[category]) {
        this.AVAILABLE_BLOCKS[category] = { };
      }
      this.AVAILABLE_BLOCKS[category][func.NAME] = func;
    } else if (typeof category === 'number' && category < Object.keys.length) {
      this.AVAILABLE_BLOCKS[Object.keys(this.AVAILABLE_BLOCKS)[category]] = func;
    }
  }

  public update () {
    // Remove old categories
    const categories = this.shadowRoot?.querySelectorAll('#library > div');
    categories?.forEach((c) => c.parentElement?.removeChild(c));

    // Populate list of available blocks
    Object.keys(this.AVAILABLE_BLOCKS).forEach((category) => {
      const wrapper = document.createElement('div');
      const heading = document.createElement('h4');
      heading.innerText = category;
      heading.id = category.toLowerCase().replace(/\s+/g, '-');
      const collapsible = document.createElement('grml-collapsible');
      collapsible.setAttribute('handle', heading.id);
      const list = document.createElement('ul');
      const items = Object.keys(this.AVAILABLE_BLOCKS[category]);
      list.append(...items.map((name: any) => {

        const functionConstructor: any = this.AVAILABLE_BLOCKS[category][name];
        const li = document.createElement('li');
        const icon = new Image();
        icon.src = functionConstructor.ICON_SRC;
        const label = document.createElement('span');
        if (functionConstructor.DESCRIPTION) {
          const tooltip = new GrMLTooltip(functionConstructor.DESCRIPTION);
          li.addEventListener('mouseenter', () => tooltip.open());
          li.addEventListener('mouseleave', () => tooltip.close());
        }

        label.innerText = functionConstructor.VERBOSE_NAME;
        li.append(icon, label);

        li.draggable = true;

        li.addEventListener('dragstart', (e) => {
          window.dispatchEvent(new GrMLLibraryItemDragStartEvent(name));
          e.dataTransfer?.setData('type', DRAG_EVENTS.CREATE_BLOCK);
          e.dataTransfer?.setData('name', name);
        });

        return li;
      }));

      wrapper.append(heading, collapsible);
      collapsible.appendChild(list);
      this.shadowRoot?.querySelector('#library')?.appendChild(wrapper);
    });
  }
}
