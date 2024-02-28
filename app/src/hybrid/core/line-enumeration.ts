import { GrMLElement } from '../../core/element';
import {
  template,
  stylesheet,
} from '../../core/util';

/**
 * TODO: Enumerates each shown code line.
 */
export class GrMLLineEnumeration extends GrMLElement {
  public static TAG_NAME = 'grml-line-enumeration';
  private numberOfLines = 2; // counter
  private enumerationContainer;

  constructor () {
    super([
      stylesheet`css/grml-text-editor.css`,
      template`
          <div id='enumeration'>
            <div>1</div>
            <div>2</div>
          </div>
        ` ]);
    this.enumerationContainer = this.shadowRoot?.getElementById('enumeration');
  }

  /**
   * Appends a new line of enumeration for the coding space
   */
  public appendLine (): void {
    if (this.enumerationContainer) {
      this.numberOfLines++;
      this.enumerationContainer.innerHTML +=
        '<div>'+this.numberOfLines+'</div>';
    }
  }

  public removeLine (): void {
    if(this.enumerationContainer){
      this.numberOfLines--;
      this.enumerationContainer.lastChild?.remove();
    }
  }

  public update (): void {
    throw new Error('Method not implemented.');
  }

}