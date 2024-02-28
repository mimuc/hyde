import { stylesheet } from '../core/util';

export class GrMLOverlay extends HTMLElement {
  public wrapper = document.createElement('div');

  constructor (public title: string = '') {
    super();
    this.attachShadow({ mode: 'open' });
    this.wrapper.classList.add('content-wrapper');
    this.shadowRoot?.append(
      stylesheet`css/grml-overlay.css`,
      this.wrapper,
    );
    if (title && title.length) {
      const h2 = document.createElement('h2');
      h2.innerText = title;
      this.wrapper.appendChild(h2);
    }
    document.body.appendChild(this);
    this.hide();
  }

  public show () {
    this.classList.remove('hidden');
  }

  public hide () {
    this.classList.add('hidden');
  }

  public connectedCallback () {
    this.addEventListener('click', () => this.hide());
    this.wrapper.addEventListener('click', (e) => e.stopPropagation());
    this.wrapper.append(...this.childNodes);
  }
}