export class GrMLTooltip extends HTMLElement {
  public static TAG_NAME = 'grml-tooltip';

  constructor (public message: string | (() => string), classes: string[] = [ ]) {
    super();
    document.body.appendChild(this);
    this.classList.add(...classes);
    this.close();
  }

  public open () {
    if (typeof this.message === 'function') {
      this.innerHTML = this.message();
    } else {
      this.innerHTML = this.message;
    }
    this.classList.remove('hidden');

    document.addEventListener('mousemove', this.followCursor);
  }

  public close () {
    document.removeEventListener('mousemove', this.followCursor);
    this.classList.add('hidden');
  }

  private followCursor = (e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    this.style.left = `${x + 5}px`;
    this.style.top = `${y + 5}px`;
  };


}