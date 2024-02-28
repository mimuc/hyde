import {
  BLANK_IMAGE,
  inlineStyle,
  stylesheet,
} from '../util';
import { GrMLBlock } from './blocks';
import { GrMLElement } from '../element';
import { GrMLConsole } from '../console';
import { GrMLPortConnectedEvent, GrMLRepresentationChangeEvent } from '../event';
import {
  HasErrors,
  HasWarnings,
  NO_DATA_FOUND_RESPONSE,
  Warning,
  withWarningNotifier,
} from '../error-reporting';
import {
  GrMLDataType,
  GrMLType,
  HasType,
} from '../types';
import { GrMLTooltip } from '../../elements/tooltip';
import { GrMLConnectionSerialisation } from '../serializable.interface';
import { GrMLConnection, GrMLFunctionIO } from '../functionIO';


/**
 * Represents I/O points for {@link GrMLConnectionRepresentation}s between {@link GrMLElement}s
 */
@withWarningNotifier()
export abstract class GrMLPort extends GrMLElement implements HasWarnings, HasErrors, HasType {
  /** List of modeled Connections */
  public connections: GrMLConnectionRepresentation[] = [ ];
  public warnings: Warning[] = [ ];
  public errors: string[] = [ ];

  protected tooltip = new GrMLTooltip(() => (this.name ? this.name + ':\n' : '') + '<pre><code>' + this.type.toString() + '</code></pre>');

  private readonly label = document.createElement('label');
  private readonly warnbox = (() => {
    const box = document.createElement('ul');
    box.classList.add('warnings');
    return box;
  })();

  constructor (public parent: GrMLBlock, public parentParam: GrMLFunctionIO) {
    super([ stylesheet`css/grml-port.css` ]);
    this.shadowRoot?.append(this.label);
    this.shadowRoot?.append(this.warnbox);
    this.addEventListener('mouseenter', () => this.tooltip.open());
    this.addEventListener('mouseleave', () => this.tooltip.close());

    // override uuids to match the functionIOs uuids
    this.uuid = parentParam.uuid;
  }

  public get type (): GrMLDataType {
    return this.parentParam?.type || GrMLType.None;
  }


  public get name (): string {
    return this.parentParam.name; // attributes just exists if port is added to DOM, therefore classvariable is used
  }

  public set name (name: string) {
    this.parentParam.name = name;
    this.label.innerText = name;
  }

  public warn (warning: Warning) {
    if (!this.warnings.includes(warning)) {
      this.warnings.push(warning);
    }
    this.update();
  }

  public update () {
    if (this.warnings.length) {
      this.classList.add('has-warnings');
    } else {
      this.classList.remove('has-warnings');
    }

    this.name = this.parentParam.name; // update name
    this.label.innerText = this.name; // update label

    this.warnbox.innerHTML = '';
    this.warnings.forEach((warn) => {
      const li = document.createElement('li');
      li.innerText = warn.message;
      this.warnbox.appendChild(li);
    });
  }

  public abstract data (): void | Warning;

}

/**
 * Port for incoming connections
 */
export class GrMLInputPort extends GrMLPort {

  public data () {
    if (this.connections.length > 0) {
      const start = this.connections[0].start;
      if (start) {
        start.data();
        return;
      } else {
        return NO_DATA_FOUND_RESPONSE;
      }
    }
    return NO_DATA_FOUND_RESPONSE;
  }

  /**
   * Defines behavior when dragging a connection into the input port
   */
  public connectedCallback (): void {

    // Highlight on enter
    this.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (!this.connections) {
        this.classList.add('highlighted');
      }
    });

    // Unhighlight on leave
    this.addEventListener('dragleave', () => {
      this.classList.remove('highlighted');
    });

    // Ignore dragover
    this.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    // Add a new connection by dropping it on the input Port
    this.addEventListener('drop', () => {
      this.classList.remove('highlighted');

      const incomingConnection = GrMLConnectionRepresentation.SELECTED_CONNECTION;
      if (incomingConnection) {
        // Check connection validity

        // TODO Better type checking
        // Type Check: are the ports of the same type
        if (!incomingConnection.start) {
          return false;
        }

        if (!(
          // Same Type
          this.type.type === incomingConnection.start.type.type ||
          // Both unions and have overlap
          (this.type instanceof GrMLType.Union && incomingConnection.start.type instanceof GrMLType.Union &&
            this.type.of.filter((t) => (<any> incomingConnection.start?.type).of.map((t: any) => t.type).includes(t.type)).length > 1) ||
          // This is union
          (this.type instanceof GrMLType.Union && this.type.of.map((t) => t.type).includes(incomingConnection.start?.type.type)) ||
          // Other is union
          (incomingConnection.start.type instanceof GrMLType.Union && incomingConnection.start.type.of.map((t) => t.type).includes(this.type.type))
        )) {
          GrMLConsole.error('Trying to connect incompatible ports.');
          return;
        }

        // switch (incomingConnection.start.type.type) {
        //   case GrMLType.Tensor.TYPE: {
        //     // Override this ports shape with the incoming shape
        //     if (incomingConnection.start.type instanceof GrMLType.Tensor) {
        //       this.type = new GrMLType.Tensor(incomingConnection.start.type.shape);
        //     }
        //   }

        // }

        // Type Check: if both ports are tensors, are they compatible shapes?
        // if (this.type.type === GrMLTensorType.TYPE) {
        //   const targetShape = (<GrMLTensorType> this.type).shape;
        //   const sourceShape = (<GrMLTensorType> incomingConnection.start.type).shape;
          // if (targetShape.length !== sourceShape.length || targetShape.map((v, i) => v !== sourceShape[i]).some((v) => v)) {
            // GrMLConsole.error('Trying to connect incompatible ports.');
            // return;
          // }
        // }

        // No self connections: the output of a block may not connect directly to that blocks input
        if (incomingConnection?.start?.parent === this.parent) {
          return;
        }

        // No doubles: one pair of in/out ports may have none or a single connection
        // XXX inefficient hack, weil some() hat O(n)
        this.connections?.some((oldConn) => {
          if (oldConn.start?.uuid === incomingConnection?.start?.uuid) {
            return;
          }
        });

        // TODO: implement check for circular connections

        // All checks passed, finalize connections
        incomingConnection.end = this;
        // create a new connection for the function
        const connectionInFunction = new GrMLConnection(incomingConnection);

        // add connection to function
        connectionInFunction.start = incomingConnection.start?.parentParam;
        connectionInFunction.end = incomingConnection.end?.parentParam;
        connectionInFunction.start.connections.push(connectionInFunction);
        connectionInFunction.end?.connections.push(connectionInFunction);

        // Add connection to block representation
        // Add incoming Connection to list of connections of the originating output port
        incomingConnection.start?.connections.push(incomingConnection);

        // Add to list of connections
        this.connections?.push(incomingConnection);

        // Add to DOM
        this.parent?.parentElement?.appendChild(incomingConnection);

        // Notify websocket handler
        window.dispatchEvent(new GrMLPortConnectedEvent(connectionInFunction.serialize(), connectionInFunction));
      }


      this.update();
    });
  }
}


export class GrMLOutputPort extends GrMLPort {

  public constructor (public parent: GrMLBlock, public parentParam: GrMLFunctionIO) {
    super(parent, parentParam);

    this.addEventListener('click', (e) => {
      e.preventDefault();
      this.data();
    });

  }

  /**
   * @returns Data from parent block
   */
  public data () {
    if (this.parent) {
      const index = this.parent.outputs.indexOf(this);
      if (this.parent.outputs.length >= index) {
        this.parent.parent.data(crypto.randomUUID());
      }
    }
    return NO_DATA_FOUND_RESPONSE;
  }

  connectedCallback (): void {
    this.draggable = true;

    this.addEventListener('mousedown', () => this.tooltip.close());
    this.addEventListener('mouseup', () => this.tooltip.open());
    // Start a connection by dragging
    this.addEventListener('dragstart', (e) => {
      this.tooltip.close();
      GrMLConnectionRepresentation.SELECTED_CONNECTION = new GrMLConnectionRepresentation();
      GrMLConnectionRepresentation.SELECTED_CONNECTION.start = this;
      (<DataTransfer> e.dataTransfer).setDragImage(BLANK_IMAGE, 0, 0);
      this.classList.add('highlighted');
    });

    // End dragging without connecting
    this.addEventListener('dragend', () => {
      this.classList.remove('highlighted');
      GrMLConnectionRepresentation.SELECTED_CONNECTION = undefined;
    });
  }
}

/**
 * Representation of a single connection between exactly one {@link GrMLInputPort}
 * and exactly one {@link GrMLOutputPort}.
 */
export class GrMLConnectionRepresentation extends HTMLElement {
  public static SELECTED_CONNECTION?: GrMLConnectionRepresentation;
  public static TAG_NAME = 'grml-data-connector';

  public start?: GrMLOutputPort;
  public end?: GrMLInputPort;

  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.append(inlineStyle`
      :host {
        display: block;
        width: 45rem;
        height: .2rem;
        background-color: #aaaaaa;
        position: absolute;
        transform-origin: 0 .1rem;
        border-radius: .1rem;
      }
    `);
  }

  public get x1 (): number {
    return parseInt(this.getAttribute('x1') ?? '0');
  }

  public set x1 (x1: number) {
    this.setAttribute('x1', x1.toString());
    this.style.left = `${x1}px`;
  }

  public get y1 (): number {
    return parseInt(this.getAttribute('y1') ?? '0');
  }

  public set y1 (y1: number) {
    this.setAttribute('y1', y1.toString());
    this.style.top = `${y1}px`;
  }

  public get x2 (): number {
    return parseInt(this.getAttribute('x2') ?? '0');
  }

  public set x2 (x2: number) {
    const len = Math.sqrt(Math.pow(this.x1 - x2, 2) + Math.pow(this.y1 - this.y2, 2));
    const rotation = Math.atan((this.y2 - this.y1) / (x2 - this.x1)) / 2 / Math.PI * 360;
    this.style.width = `${len}px`;
    this.style.transform = `rotate(${x2 - this.x1 > 0 ? rotation : rotation - 180}deg)`;
    this.setAttribute('x2', x2.toString());
  }

  public get y2 (): number {
    return parseInt(this.getAttribute('y2') ?? '0');
  }

  public set y2 (y2: number) {
    const len = Math.sqrt(Math.pow(this.x1 - this.x2, 2) + Math.pow(this.y1 - y2, 2));
    const rotation = Math.atan((y2 - this.y1) / (this.x2 - this.x1)) / Math.PI * 180;
    this.style.width = `${len}px`;
    this.style.transform = `rotate(${this.x2 - this.x1 > 0 ? rotation : rotation - 180}deg)`;
    this.setAttribute('y2', y2.toString());
  }

  public serialize (): GrMLConnectionSerialisation {
    return { paramFuncId: this.end?.parent?.uuid, paramId: this.end?.uuid, returnValueId: this.start?.uuid, returnValueFuncId : this.start?.parent?.uuid };
  }

  /**
   * Delete this Connection from the Block representation
   */
  public remove () {
    //Remove from start port
    if (this.start) {
      const startIndex = this.start.connections.indexOf(this);
      if (startIndex > -1) {
        this.start.connections.splice(startIndex, 1);
      }
      this.start = undefined;
    }

    // Remove from end port
    if (this.end) {
      const endIndex = this.end.connections.indexOf(this);
      if (endIndex > -1) {
        this.end.connections.splice(endIndex, 1);
      }
      this.end = undefined;
    }

    this.parentElement?.removeChild(this);
  }

  connectedCallback (): void {
    /* eslint-disable no-self-assign */
    this.x1 = this.x1;
    this.y1 = this.y1;
    this.x2 = this.x2;
    this.y2 = this.y2;

    // window.dispatchEvent(new GrMLModelChangeEvent(this));

    const rafUpdatePosition = () => {
      this.updatePosition();
      requestAnimationFrame(rafUpdatePosition);
    };
    requestAnimationFrame(rafUpdatePosition);

    // Add EventListener to remove connection on right-click (tbc)
    this.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (this.start && this.end) {
        this.remove();
        document.dispatchEvent(new GrMLRepresentationChangeEvent());
      }
    });
  }

  updatePosition () {
    const parentRect = this.parentElement?.getBoundingClientRect();
    if (!parentRect) {
      return;
    }
    const { x: parentX, y: parentY } = parentRect;

    if (this.start) {
      const startBBox = this.start instanceof HTMLElement ? this.start.getBoundingClientRect() : this.start;
      this.x1 = startBBox.x + startBBox.width - parentX;
      this.y1 = startBBox.y + startBBox.height / 2 - parentY;
    }

    if (this.end) {
      if (this.end instanceof HTMLElement) {
        const bbox = this.end.getBoundingClientRect();
        this.x2 = bbox.x - parentX;
        this.y2 = bbox.y + bbox.height / 2 - parentY;
      } else {
        const bbox = <DOMRect> this.end;
        this.x2 = bbox.x - parentX;
        this.y2 = bbox.y - parentY;
      }
    }
  }


}


customElements.define('grml-input-port', GrMLInputPort);
customElements.define('grml-output-port', GrMLOutputPort);
customElements.define(GrMLConnectionRepresentation.TAG_NAME, GrMLConnectionRepresentation);
