import { GrMLBlock } from "./graphical/blocks";

function stringTemplate (str: TemplateStringsArray): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = str.toString();
  document.head.appendChild(template);
  return template;
}

export function template (str: TemplateStringsArray): Node {
  return document.importNode(stringTemplate(str).content, true);
}

export function inlineStyle (css: TemplateStringsArray): HTMLStyleElement {
  const style = document.createElement('style');
  style.innerHTML = css.toString();
  return style;
}

export function stylesheet (href: TemplateStringsArray): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href.toString();
  return link;
}

export const BLANK_IMAGE = (() => {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
  return img;
})();

type DraggableOptions = {
  selector?: string,
  sticky?: { x?: number | false, y?: number | false },
  grid?: boolean,
  gridSize?: number,
  ctrlGridless?: boolean,
  onDrop?: (e: DragEvent) => any,
};
export function draggable (options: DraggableOptions = { }) {
  const selector = options.selector;
  const stickyX = typeof options.sticky?.x === 'number' ? options.sticky?.x : false;
  const stickyY = typeof options.sticky?.y === 'number' ? options.sticky?.y : false;
  const grid = typeof options.grid === 'undefined' ? true : Boolean(options.grid);
  const gridSize = options.gridSize || 32;
  const ctrlGridless = options.ctrlGridless || true;
  const onDrop = options.onDrop || (() => null);
  let blocksToMove : GrMLBlock[] = [];

  return function (c: any) {
    let cursorOffset: [ number, number ] = [ 0, 0 ];
    let unconstrained: boolean = grid;

    // Add x and y position to the element
    Object.defineProperties(c.prototype, {
      x: {
        get: function () { return parseInt(this.getAttribute('x') || '0'); },
        set: function (x) {
          x = typeof stickyX === 'number' ? stickyX : x;
          this.setAttribute('x', x);
          if (x < 0) {
            this.style.right = `${x}px`;
            this.style.left = 'initial';
          } else {
            this.style.left = `${x}px`;
            this.style.right = 'initial';
          }
        },
      },
      y: {
        get: function () { return parseInt(this.getAttribute('y') || '0'); },
        set: function (y) {
          y = typeof stickyY === 'number' ? stickyY : y;
          this.setAttribute('y', y);
          if (y < 0) {
            this.style.bottom = `${y}px`;
            this.style.top = 'initial';
          } else {
            this.style.top = `${y}px`;
            this.style.bottom = 'initial';
          }
        },
      },
    });

    // Overwrite the connectedCallback with drag handlers
    // Store the original connectedCallback to ensure it is called later
    const superConnectedCallback = c.prototype.connectedCallback;


    c.prototype.connectedCallback = function () {
      // Set value to ensure attributes are also set
      this.x = this.x; // eslint-disable-line no-self-assign
      this.y = this.y; // eslint-disable-line no-self-assign

      // What to use for dragging?
      const documentRoot = this.shadowRoot || this;
      const handle = <HTMLElement> (selector ? documentRoot.querySelector(selector) : this);
      if (handle) {
        handle.draggable = true;

        handle.addEventListener('dragstart', (e: DragEvent) => this.onDragStart(e));
        handle.addEventListener('drag', (e: DragEvent) => this.onDrag(e));
        handle.addEventListener('dragend', (e: DragEvent) => this.onDragEnd(e));
      }

      // Call original conncetedCallback
      superConnectedCallback.call(this);
    };


    // Add the drag handles to the prototype for access from within the class
    // This allows for modification from within the target class
    c.prototype.onDragStart = function (event: DragEvent) {

      const nodesToMove = (<GrMLBlock>this).parentNode?.querySelectorAll('.selected');
      if(nodesToMove){
        blocksToMove = <GrMLBlock[]> Array.from(nodesToMove).filter((f) => (f !== this));
      }

      unconstrained = (grid && ctrlGridless) ? Boolean(event.ctrlKey) : !grid;
      const cursor = { x: event.pageX, y: event.pageY };
      const { left, top } = this.getBoundingClientRect();
      const reference = this.parentElement?.getBoundingClientRect();
      const [ refLeft, refTop ] = reference ? [ reference.left, reference.top ] : [ 0, 0 ];
      const relativeCursorOffset: [number, number] = [ cursor.x - left + refLeft , cursor.y - top + refTop ];

      event.dataTransfer?.setDragImage(BLANK_IMAGE, 0, 0);
      cursorOffset = relativeCursorOffset;
    };

    c.prototype.onDrag = function (event: DragEvent) {
      this.dragToPos(event);
    };

    c.prototype.onDragEnd = function (event: DragEvent) {
      this.dragToPos(event);
      if (!unconstrained) {
        this.x = gridSize * Math.round(this.x / gridSize);
        this.y = gridSize * Math.round(this.y / gridSize);
      }
      unconstrained = !grid;

      //TODO alter position of other selected ones
      
      onDrop(event);
    };

    c.prototype.dragToPos = function (event: DragEvent) {
      event = <DragEvent>(event || window.event);
      if(blocksToMove.length > 0){
        // position for selected elements (other than the curently dragged one)
        blocksToMove.forEach((b) => {
          const xPos = b.x + (event.pageX - this.x - cursorOffset[ 0 ]);
          const yPos = b.y + (event.pageY - this.y - cursorOffset[ 1 ]);
          b.x = xPos > 0 ? xPos : 0;
          b.y = yPos > 0 ? yPos : 0;
        });
      }
      this.x = event.pageX - cursorOffset[0];
      this.y = event.pageY - cursorOffset[1];
   
    };
  };
}

export const consoleLabelStyle = (background?: string, color?: string) =>
  `display: inline-block;
  padding: .5em;
  background-color: ${ background || '#0078D7' };
  color: ${ color || '#ffffff' };`;


export interface IsCode {
  toCode (): string[];
}