import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLGraphicalEditor } from '../../core/editor';
import { GrMLExecuteCodeEvent, GrMLNameChangeEvent, NAME_CHANGE_EVENTS } from '../../core/event';
import { GrMLBlockLibrary } from '../../core/graphical/library';
import { GrMLPipelineModel } from './model';
import { GrMLFunction } from '../../core/function';
import { GrMLPropertyType } from '../../core/properties';
import { GrMLConsole } from '../../core/console';

const PIPELINEABLE_FUNCTIONS: { [category: string]: any[] } = {};

export function pipelineComponent (category = GrMLBlockLibrary.MISC_LABEL, index = -1) {
  return (c: any) => {
    if (!PIPELINEABLE_FUNCTIONS[category]) {
      PIPELINEABLE_FUNCTIONS[category] = [];
    }
    if (!((<any> PIPELINEABLE_FUNCTIONS[category]).index)) {
      Object.defineProperty(PIPELINEABLE_FUNCTIONS[category], 'index', {
        value: index,
        writable: true,
      });
    } else {
      (<any> PIPELINEABLE_FUNCTIONS[category]).index = Math.max((<any> PIPELINEABLE_FUNCTIONS[category]).index, index);
    }
    PIPELINEABLE_FUNCTIONS[category].push(c);
    return c;
  };
}


/**
 * Editor for creating the high level data processing pipeline
 */
export class GrMLPipelineEditor extends GrMLGraphicalEditor<GrMLPipelineModel> {
  public static TAG_NAME = 'grml-pipeline-editor';

  constructor (public model: GrMLPipelineModel) {
    super(PIPELINEABLE_FUNCTIONS);
    console.info(PIPELINEABLE_FUNCTIONS);
    this.shadowRoot?.appendChild(this.zoomWrapper);
    this.shadowRoot?.appendChild(this.brushingContainer);
    const aside = document.createElement('aside');
    aside.appendChild(this.library);
    aside.appendChild(this.propertyEditor);
    this.shadowRoot?.appendChild(aside);
  }

  public onSelect (f: GrMLFunction | null) {
    if (f) {
      if (f.parameters) {
        // add a editable property for each input port
        f.parameters.forEach((param, index) => {
          f.properties['inputPort' + index] = {
            label: 'Input Port ' + index, type: GrMLPropertyType.STRING, description: 'name of the input port', value: param.name || undefined,
            onChange: (value) => {
              // TODO: Flo wenn inport name changed, dann evtl. lastCodeEdit neu setzen?! Problem ist, dass Code und Blocks/Connections nicht übereinstimmen

              param.name = value;
              window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.PARAMETER, param.uuid, param.name, param.parent?.uuid));
            }
          };
        });
      }
      if (f.returnValues) {
        // add a editable property for each output port
        f.returnValues.forEach((ret, index) => {
          const oldName = ret.name;
          f.properties['outputPort' + index] = {
            label: 'Output Port ' + index, type: GrMLPropertyType.STRING, description: 'name of the output port', value: ret.name || undefined,
            onChange: (value) => {
              ret.name = value;
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

  public onGroup (bs: GrMLBlock[]) {
    throw new Error('Method not implemented.');
    // const { x, y } = bs.reduce(
    //   ({ x, y }: { x: number, y: number }, curr) => ({
    //     x: x + (<any> curr)['x'] / bs.length,
    //     y: y + (<any> curr)['y'] / bs.length,
    //   }),
    //   { x: 0, y: 0 }
    // );
    // this.model.children = this.model.children.filter((f) => bs.indexOf(f) === -1);
    // // TODO: use addFunction() instead of addBlock
    // const group = <GrMLGroupBlock> this.model.addFunction(GrMLGroupBlock.TAG_NAME, { x, y });
    // bs.forEach((b) => group.model.addFunction(b));
    // group.update();
    // this.update();
    // // TODO: Create correct number of I/O ports
    // // TODO: Reattach existing connecitons
  }

  public onDuplicate (bs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }
}
