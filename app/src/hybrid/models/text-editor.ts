import { stylesheet } from '../../core/util';
import { GrMLTextEditor } from '../core/text-editor';
import { GrMLTextModel } from './text-model';


/**
 * Editor for high level textual code editing in hybrid mode.
 */
export class GrMLHybridTextEditor extends GrMLTextEditor<GrMLTextModel> {
  public static TAG_NAME = 'grml-text-editor';

  private aside = (() => {
    const aside = document.createElement('aside');
    aside.classList.add('enumeration');
    return aside;
  })();


  constructor (public model: GrMLTextModel) {
    super(
      [
        stylesheet`css/grml-text-editor.css`,
      ]
    );

    // Toolbar
    this.shadowRoot?.appendChild(this.toolbar);
    // Append static container
    this.shadowRoot?.appendChild(this.container);

    // this.aside.appendChild(this.enumeration);
    // Left column with enumeration
    // this.container.appendChild(this.aside);

    // Scroll container for code
    this.container.appendChild(this.scrollContainer);
    // Workspace
    this.scrollContainer.appendChild(this.scriptingArea);
  }

}