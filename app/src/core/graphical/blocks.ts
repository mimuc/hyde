import {
  draggable,
  template,
  stylesheet,
} from '../util';
import {
  GrMLInputPort,
  GrMLOutputPort,
} from './ports';
import {
  GrMLElement,
} from '../element';
import {
  SELECTION_TYPE,
  GrMLBlockConnectedEvent,
  GrMLFunctionSelectEvent,
  GrMLRepresentationChangeEvent,
} from '../event';
import { GrMLModel } from '../model';
import {
  GrMLBlockSerialization,
  GrMLModelBlockSerialization,
  Serializable,
} from '../serializable.interface';
import { GrMLFunction } from '../function';
import { GrMLRepresentation, REPRESENTATION_TYPES } from '../representation';


function grmlBlockBaseSerialization (block: GrMLBlock): GrMLBlockSerialization {
  return {
    type: block.tagName,
    name: block.name,
    protected: block.protected,
    locked: block.locked,
    inputs: block.inputs.map((i) => ({ name: i.name, uuid: i.uuid, portName: i.name, connections: i.connections })),
    outputs: block.outputs.map((o) => ({ name: o.name, uuid: o.uuid, portnName: o.name })),
    position: {
      x: block.getAttribute('x') || null,
      y: block.getAttribute('y') || null,
    },
  };
}

/**
 * Generic block type.
 * Sets up :
 * * general DOM
 * * drag and drop functionality
 * * input and output ports
 * * buttons and other controls
 *
 * Provides lifecylcle hoos:
 * * beforeConnected: Executed at the start of connectedCallback
 * * afterConnected : Executed at the end of connectedCallback
 */
@draggable({
  selector: '.header',
  onDrop: () => window.dispatchEvent(new GrMLRepresentationChangeEvent()),
})
export abstract class GrMLBlock
  extends
  GrMLElement
  implements
  GrMLRepresentation,
  Serializable
  //HasParent<GrMLModel>,
{
  public static TAG_NAME = 'grml-block';
  public static DEFAULT_ICON?: string | undefined;

  /**
   * Creates a GrMLBlock from a JSON representation.
   *
   * @param obj JSON representation of the block
   * @param parent Parent @see{GrMLModel} if any
   * @returns A block as specified in the input
   */
  public static deserialize (obj: GrMLBlockSerialization | string, parent: GrMLFunction): GrMLBlock {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }

    if (typeof obj !== 'object') {
      throw new Error('Could not deserialize block.');
    }

    const serialization: GrMLBlockSerialization = obj;
    const blockType = serialization.type;
    const blockConstructor = customElements.get(blockType.toLowerCase()); // get custom element constructor
    if (blockConstructor) {
      const block = <GrMLBlock> new blockConstructor();
      block.protected = Boolean(serialization.protected);
      block.locked = Boolean(serialization.locked);
      block.inputs.forEach((input, index) => {
        const sInput = serialization.inputs[index];
        input.uuid = sInput.uuid;
        input.name = sInput.name;
        if (sInput.portName) {input.name = sInput.portName;}
      });
      block.outputs.forEach((output, index) => {
        const sOutput = serialization.outputs[index];
        output.uuid = sOutput.uuid;
        output.name = sOutput.name;
        if (sOutput.portName) {output.name = sOutput.portName;}
      });
      block.setAttribute('x', serialization.position.x || '0');
      block.setAttribute('y', serialization.position.y || '0');

      block.parent = parent;
      block.update();

      return block;
    }

    throw new Error('Could not deserialize block representation.');
  }



  public REPRESENTATION_TYPE = REPRESENTATION_TYPES.BLOCK;
  public controls: { label: string, action: any, id?: string, className?: string }[] = [];
  public inputs: GrMLInputPort[] = [ ];
  public outputs: GrMLOutputPort[] = [ ];

  private isProtected = false;
  private isLocked = false;
  private readonly warnbox = (() => {
    const box = document.createElement('ul');
    box.classList.add('warnings');
    return box;
  })();


  constructor (
    public parent: GrMLFunction,
  ) {
    super([
      stylesheet`css/grml-block.css`,
      template`<div class="header">
        <img src="img/icons/hamburger.svg">
        <h3></h3>
      </div>
      <div class="block-content">
        <div class="inputs">
        </div>
        <div class="core"></div>
        <div class="outputs">
        </div>
      </div>
      <div class="info"></div>`
    ]);

    // Set up DOM:
    // Title
    const title = this.shadowRoot?.querySelector('h3');
    this.shadowRoot?.append(this.warnbox);

    if (title) {

      title.innerText = this.name;
      // TODO
      // title.addEventListener('dblclick', (e) => {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   title.contentEditable = 'true';
      //   title.focus();
      // });

      const onTitleEdit = () => {
        title.contentEditable = 'false';
        title.innerHTML = title.innerText.replace(/<[^>]+>/g, '').trim();
        const newTitle = title.innerText;
        this.name = newTitle;
      };
      title.addEventListener('blur', onTitleEdit);
      title.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          onTitleEdit();
        }
      });
    }

    // IO Ports
    this.updateIOPorts();

    this.addEventListener('click', (e) => {
      window.dispatchEvent(new GrMLFunctionSelectEvent(this.parent, e.ctrlKey ? SELECTION_TYPE.CTRL_TRUE : SELECTION_TYPE.SWITCH));
    });
  }

  public get name () {
    return this.parent.name;
  }

  public set name (n: string) {
    this.parent.name = n;
    const title = this.shadowRoot?.querySelector('h3');
    if (title) {
      title.innerText = n;
    }
  }

  public get inputCount () {
    return this.inputs.length;
  }

  public get outputCount () {
    return this.outputs.length;
  }

  public get protected () {
    return this.isLocked || this.isProtected;
  }

  public set protected (p: boolean) {
    this.isProtected = p;
    if (this.isProtected) {
      this.setAttribute('protected', 'true');
    } else {
      this.removeAttribute('protected');
    }
  }

  public get locked () {
    return this.isLocked;
  }

  public set locked (l: boolean) {
    this.isLocked = l;
    if (this.isLocked) {
      this.setAttribute('locked', 'true');
    } else {
      this.removeAttribute('locked');
    }
  }

  public get selected (): boolean {
    return Boolean(this.classList.contains('selected'));
  }

  /**
   * Adds and removes the selected/highlight stlying from block.
   *
   * @param h
   */
  public set selected (h) {
    if (h) {
      this.classList.add('selected');
    } else {
      this.classList.remove('selected');
    }
  }

  /**
   * Provides a stringifyable JSON representation of this block
   *
   * @returns {any} JSON representation of this block
   */
  public serialize (): GrMLBlockSerialization {
    return grmlBlockBaseSerialization(this);
  }

  public connectedCallback () {
    // Inner Buttons
    if (this.controls.length) {
      const core = this.shadowRoot?.querySelector('.core');
      if (core) {
        core.innerHTML = '';
        const controls = document.createElement('div');
        controls.classList.add('controls');
        core.appendChild(controls);
        this.controls.forEach(({ action, label, className, id }) => {
          const btn = document.createElement('button');
          if (id) {
            btn.id = id;
          }
          btn.className = className || '';
          btn.addEventListener('click', (e) => action.call(this, e));
          btn.innerText = label;
          controls.append(btn);
        });
      }
    }

    window.dispatchEvent(new GrMLBlockConnectedEvent());
  }

  public update () {

    this.updateIOPorts();
    this.inputs.forEach((i) => i.update());
    this.outputs.forEach((o) => o.update());

    // indicate warnings
    if (this.parent.warnings.length) {
      this.classList.add('has-warnings');
    } else {
      this.classList.remove('has-warnings');
    }
    // show warning messages
    this.warnbox.innerHTML = '';
    this.parent.warnings.forEach((warn) => {
      const li = document.createElement('li');
      li.innerText = warn.message;
      this.warnbox.appendChild(li);
    });
  }

  /**
   * Adds missing representations of In- and OutputPorts.
   */
  private updateIOPorts () {
    // Input Ports
    this.parent.parameters.forEach((param, index) => {
      if (!this.inputs[ index ]) {
        const input = new GrMLInputPort(this, param);
        input.parent = this;
        this.shadowRoot?.querySelector('.inputs')?.append(input);
        this.inputs.push(input);
      }

    });

    // Output Ports
    this.parent.returnValues.forEach((ret, index) => {
      if (!this.outputs[ index ]) {
        const output = new GrMLOutputPort(this, ret);
        output.parent = this;
        this.shadowRoot?.querySelector('.outputs')?.append(output);
        this.outputs.push(output);
      }
    });
  }
}

// TODO: refactor to function
export abstract class GrMLModelBlock extends GrMLBlock {

  constructor (parent: GrMLFunction, public model: GrMLModel) {
    super(parent);
    this.name = model.name;
  }

  public get name () {
    if (this.model) {
      return this.model.name;
    } else {
      return 'Unnamed Model';
    }
  }

  public set name (n: string) {
    if (this.model) {
      this.model.name = n;
      // TODO: keep
      const title = this.shadowRoot?.querySelector('h3');
      if (title) {
        title.innerText = n;
      }
    }
  }

  public serialize (): GrMLModelBlockSerialization {
    const serialization = <GrMLModelBlockSerialization> grmlBlockBaseSerialization(this);
    serialization.model = this.model.serialize();
    return serialization;
  }
}