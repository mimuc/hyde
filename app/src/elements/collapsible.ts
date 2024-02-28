export class GrMLCollapsible extends HTMLElement {
  public static get observedAttributes () {
    return [ 'handle' ];
  }

  public attributeChangedCallback (name: string, oldValue: string, newValue: string): void {
    if (name === 'handle') {
      if (oldValue) {
        this.parentElement?.ownerDocument
          .getElementById(oldValue)?.removeEventListener('click', this.toggleFunction);
      }
      this.parentElement?.ownerDocument
        .getElementById(newValue)?.addEventListener('click', this.toggleFunction);

    }
  }

  public connectedCallback () {
    const handle = this.parentNode?.querySelector('#' + this.getAttribute('handle'));
    handle?.addEventListener('click', this.toggleFunction);
  }

  private toggleFunction = () => {
    this.classList.toggle('hidden');
  };

}