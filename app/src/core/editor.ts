import { GrMLBlock } from './graphical/blocks';
import { GrMLElement } from './element';
import { SELECTION_TYPE, DRAG_EVENTS, GrMLFunctionSelectEvent, GrMLNameChangeEvent, GrMLSelectionChangedEvent, NAME_CHANGE_EVENTS, GrMLUpdateVariablesMessage, GrMLExecuteCodeEvent } from './event';
import { GrMLFunction } from './function';
import { GrMLBlockLibrary } from './graphical/library';
import { GrMLModel } from './model';
import { GrMLConnectionRepresentation } from './graphical/ports';
import { consoleLabelStyle, stylesheet } from './util';
import { GrMLRepresentation, REPRESENTATION_TYPES } from './representation';
import { GrMLPropertyEditor, GrMLPropertyType } from './properties';
import { GrMLConsole } from './console';
<<<<<<< HEAD
import { GrMLFunctionIO } from './functionIO';
=======
>>>>>>> 8e81225 (Fix error when renaming output variable name when GrMLFunction has not been computed yet)

/**
 * Editor interface for representing arbitrary editors.
 */
export interface GrMLEditor<M extends GrMLModel> extends GrMLElement{
  readonly TAG_NAME?: string;
  readonly REPRESENTATION_TYPE: REPRESENTATION_TYPES;
  model: M;
  library?: GrMLBlockLibrary;
  update (): void;
  updateConnections(f: GrMLFunction): void;
  onSelect (b: GrMLFunction | null): void;
  onGroup (bs: GrMLRepresentation[]): void;
  onDuplicate (bs: GrMLRepresentation[]): void;
  onDrop (e: DragEvent): void;
}

/**
 * Abstract class for representing arbitrary graphical editors.
 * Provides:
 * a zoomable wrapper for displaying blocks and a library panel.
 * an element to select more nodes by brushing.
 */
export abstract class GrMLGraphicalEditor<M extends GrMLModel> extends GrMLElement implements GrMLEditor<M> {
  public REPRESENTATION_TYPE = REPRESENTATION_TYPES.BLOCK;
  public currentZoomLevel = 0;
  public library = <GrMLBlockLibrary> document.createElement(GrMLBlockLibrary.TAG_NAME);
  public readonly propertyEditor = <GrMLPropertyEditor>document.createElement(GrMLPropertyEditor.TAG_NAME);
  protected zoomWrapper: HTMLElement = (() => {
    const zoomWrapper = document.createElement('div');
    zoomWrapper.id = 'zoomWrapper';
    zoomWrapper.classList.add('zoom-wrapper');
    return zoomWrapper;
  })();
  protected brushingContainer: HTMLElement = (() => {
    const brushingContainer = document.createElement('div');
    brushingContainer.classList.add('brushing-container');
    brushingContainer.classList.add('hidden');
    return brushingContainer;
  })();

  public abstract model: M;

  constructor (
    registeredBlocks: { [category: string]: any } = { },
    additionalStyles: Node[] = [ ],
  ) {
    super([
      stylesheet`css/grml-editor.css`,
      ...additionalStyles,
    ]);

    Object.entries(registeredBlocks)
      .sort((a: any, b: any) => (a[1]['index'] || -1) > (b[1]['index'] || -1) ? 1 : -1)
      .forEach(([ category, blocks ]) => blocks
        .forEach((block: any) => this.library.register(block, category))
      );


    this.addEventListener('wheel', this.onZoom);
    this.addEventListener('dragenter', (e) => e.preventDefault());
    this.addEventListener('dragover', (e) => e.preventDefault());
    this.addEventListener('drop', this.onDrop);
    this.addEventListener('contextmenu', (e) => e.stopPropagation());
    this.addEventListener('mousedown', this.onMouseDown);
  }

  public get zoomLevel (): number {
    return this.currentZoomLevel;
  }

  /**
   * Set the zoom level. Also updates the DOM style to reflect the zoom.
   */
  public set zoomLevel (z: number) {
    this.currentZoomLevel = z;

    const zoomWrapper = this.shadowRoot?.getElementById('zoomWrapper');
    if (zoomWrapper) {
      zoomWrapper.style.transform = `scale(${1 + this.currentZoomLevel * 0.1})`;
    }
    this.style.backgroundSize = `calc(${1 + this.currentZoomLevel * 0.1} * var(--grid-size))`;
  }

  public updateConnections (): void {
    throw new Error('Updating connections in graphical representation not implemented.');
  }

  public update () {
    if (!this.model) {
      return;
    }

    // Hide blocks that have been removed from the model
    [ ...this.zoomWrapper.querySelectorAll(`:not(${GrMLConnectionRepresentation.TAG_NAME})`) ].forEach((n) => {
      const block = <GrMLBlock>n;
      if (this.model.children.indexOf(block.parent) < 0) {
        this.zoomWrapper.removeChild(block);
      }
    });

    // Hide connections removed from the model
    [ ...this.zoomWrapper.querySelectorAll('grml-data-connector') ].forEach((connection) => {
      if (
        connection &&
        connection instanceof GrMLConnectionRepresentation &&
        connection.parentElement === this.zoomWrapper
      ) {
        if (connection.end === undefined || connection.start === undefined) {
          this.zoomWrapper.removeChild(connection);
        }
      }
    });

    // Display all new blocks and their connections in the model
    this.model.children.forEach((grMLfunction: GrMLFunction) => {
      const block = <GrMLBlock> grMLfunction.representations[this.REPRESENTATION_TYPE];
      //display the block
      if (block && block.parentNode !== this.zoomWrapper) {
        this.zoomWrapper.appendChild(block);
      }

      // update view of each block connection
      block?.inputs.forEach((input) => {

        input.connections?.map((conn) => {
          if (conn instanceof HTMLElement) {
            if (
              // Connection is already a GrMlConnection -> append to DOM if not already appended
              conn.parentElement !== this.zoomWrapper &&
              conn.start &&
              conn.end &&
              conn.start.parent?.parentElement === this.zoomWrapper &&
              conn.start.parent?.parentElement === this.zoomWrapper
            ) {
              this.zoomWrapper.appendChild(conn);
            } else if (typeof conn === 'undefined') {
              // Noop
            } else if (!conn.start) {
              // Remove connections without start port
              if (conn.parentElement === this.zoomWrapper) {
                this.zoomWrapper.removeChild(conn);
              }
            }
          }
        });
      });
      grMLfunction.update(); //update each function
    });

    this.model.children.map((f) => {
      const rep = <GrMLRepresentation> f.representations[ this.REPRESENTATION_TYPE ];
      if (rep) {
        if (f.selected) {
          rep.classList.add('selected');
        } else {
          rep.classList.remove('selected');
        }
      }
    });

  }


  public onDrop (e: DragEvent) {
    const type = e.dataTransfer?.getData('type');
    console.info('%cDropped', consoleLabelStyle('#009440'), type);

    if (type === DRAG_EVENTS.CREATE_BLOCK) {
      const tag = e.dataTransfer?.getData('name');
      if (tag) {
        const { pageX: x, pageY: y } = e;
        const { left, top } = this.zoomWrapper.getBoundingClientRect();

        const newFunction = this.model.addFunction(tag);
        const block = <any> newFunction.representations[this.REPRESENTATION_TYPE];
        if (block) {
          block.x = x - left;
          block.y = y - top;
        }
      }
    }
  }

  public onSelect (f: GrMLFunction | null) {
    if (f) {
      if (f.parameters) {
        // add a editable property for each parameter
        f.parameters.forEach((param, index) => {
          f.properties['inputPort' + index] = {
            label: 'Input Port Name' + index, type: GrMLPropertyType.STRING, description: 'name of the parameter', value: param.name || undefined,
            onChange: (value) => {
              // TODO: Flo wenn inport name changed, dann evtl. lastCodeEdit neu setzen?! Problem ist, dass Code und Blocks/Connections nicht übereinstimmen

              param.name = value;
              window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.PARAMETER, param.uuid, param.name, param.parent?.uuid));
            }
          };
        });
      }
      if (f.returnValues) {

        f.returnValues.forEach((ret, index) => {
          const oldName = ret.name;
          f.properties['outputPort' + index] = {
            label: 'Output Port Name' + index, type: GrMLPropertyType.STRING, description: 'name of the return value', value: ret.name || undefined,
            onChange: (value) => {

              ret.name = this.addVariableToModel(value, ret);
              window.dispatchEvent(new GrMLUpdateVariablesMessage(ret));
              window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.RETURN_VALUE, ret.uuid, ret.name, ret.parent?.uuid));

              f.renameVariable(oldName, value);
            }
          };
        });
      }
      this.propertyEditor.props = f.properties;
    } else {
      this.propertyEditor.props = {};
    }
  }

  /**
   * Checks if variable is alreday used,
   * adds it to the model,
   *
   * @param value new name
   * @param functionIO return value
   * @returns name if successfull
   */
  private addVariableToModel (value: any, functionIO: GrMLFunctionIO): string {
    const type = functionIO.type;
    const oldName = functionIO.name;
    if (typeof value === 'string') {
      value = value.replace(' ', '_'); // remove empty spaces
    } else {
      // TODO: give feedback, variable name must be of type string
    }

    // function IO is renamed
    if (oldName) {
      if (value === oldName) {
        // name did not change
        return value; // do nothing
      } else {
        // remove old variable
        this.model.removeVariable(oldName);
      }
    }

    // after old name is checked (and deleted)
    if (value.length === 0) {
      // if name is empty string, return
      return value;
    }

    // check a variable with the same name exists within the model
    const variable = this.model.getVariableFromName(value);
    if (variable) {
      GrMLConsole.error(`Variable with name ${value} does already exist.`);
      // throw new Error('Variable name does already exists');
    } else {
      this.model.addVariable(value, type);
    }

    return value;
  }

  /**
   * Ctrl+Wheel to Zoom
   *
   * @param e {WheelEvent} Mouse Wheel Event
   */
   private onZoom (e: WheelEvent) {
    if (e.ctrlKey && (<any>e).path[0] === this.zoomWrapper) {
      e.preventDefault();
      this.zoomLevel += e.deltaY > 0 ? 1 : -1;
    }
    // else: allow scrolling in properties and library
  }

  /**
   * Handler for whenever the background of the GP editor is clicked
   *
   * Enables brushing to select more than one block
   * and clicking on the background to de-select all.
   *
   * @param e MouseDown event
   */
  private onMouseDown (e: MouseEvent) {
    // when background is clicked
    if ((<any> e).path[ 0 ] === this.zoomWrapper) {
      this.brushingContainer.setAttribute('x', e.pageX.toString());
      this.brushingContainer.setAttribute('y', e.pageY.toString());
      this.brushingContainer.style.top = e.pageY.toString() + 'px';
      this.brushingContainer.style.left = e.pageX.toString() + 'px';

      this.addEventListener('mousemove', this.whileBrusing);
      this.addEventListener('mouseup', this.endBrushing);
      this.brushingContainer.classList.remove('hidden');
    }
  }

  private whileBrusing (e: MouseEvent) {
    // position, anchorpoint of div
    const x = parseInt(this.brushingContainer.getAttribute('x') || '0');
    const y = parseInt(this.brushingContainer.getAttribute('y') || '0');

    // expand div in the right direction
    let width = 0;
    let height = 0;
    // in case cursor position is...
    if (e.pageX > x) {
      // right from x
      width = e.pageX - x;
      this.brushingContainer.classList.remove('translate-left');
    }
    else {
      // left from x
      width = x - e.pageX;
      this.brushingContainer.classList.add('translate-left');
    }

    if (e.pageY > y) {
      // below y
      height = e.pageY - y;
      this.brushingContainer.classList.remove('translate-up');
    }
    else {
      // above y
      height = y - e.pageY;
      this.brushingContainer.classList.add('translate-up');
    }

    if(e.pageY < y && e.pageX < x){
      // above y and left from x
      // needed, as only one css translation-rule works at the same time
      this.brushingContainer.classList.add('translate-up-left');
    } else {
      this.brushingContainer.classList.remove('translate-up-left');
    }

    // apply height and width
    this.brushingContainer.style.width = width + 'px';
    this.brushingContainer.style.height = height + 'px';
  }

  private endBrushing (e: MouseEvent) {
    // remove event listener
    this.removeEventListener('mousemove', this.whileBrusing);
    this.removeEventListener('mouseup', this.endBrushing);
    const x = parseInt(this.brushingContainer.getAttribute('x') || '0');
    const y = parseInt(this.brushingContainer.getAttribute('y') || '0');

    if (x === e.pageX && y === e.pageY) {
      // click is performed
      window.dispatchEvent(new GrMLFunctionSelectEvent(null));
    } else {
      // brushing
      // change selection
      const functionsWithinContainer: GrMLFunction[] = [];
      const min = { minX: Math.min(...[ x, e.pageX ]), minY: Math.min(...[ y, e.pageY ]) };
      const max = { maxX: Math.max(...[ x, e.pageX ]), maxY: Math.max(...[ y, e.pageY ]) };

      [ ...this.zoomWrapper.querySelectorAll(`:not(${GrMLConnectionRepresentation.TAG_NAME})`) ].forEach((n) => {
        const block = <GrMLBlock> n;
        const bx = parseInt(block.getAttribute('x') || '-1');
        const by = parseInt(block.getAttribute('y') || '-1');

        // block is in selection area
        if (bx > min.minX && by > min.minY && bx < max.maxX && by < max.maxX) {
          functionsWithinContainer.push(block.parent);
          // TODO: dispatch event with all selected functions instead of one for each
          window.dispatchEvent(new GrMLFunctionSelectEvent(block.parent, SELECTION_TYPE.ADD)); // adds block to selection
        }
      });
    }

    // reset brushing area
    this.brushingContainer.style.width = '0';
    this.brushingContainer.style.height = '0';
    this.brushingContainer.classList.add('hidden');
  }

  public abstract onGroup (bs: GrMLBlock[]): void;
  public abstract onDuplicate (bs: GrMLBlock[]): void;

}
