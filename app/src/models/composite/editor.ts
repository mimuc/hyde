import { stylesheet } from '../../core/util';
import { GrMLGraphicalEditor } from '../../core/editor';
import { GrMLPropertyEditor } from '../../core/properties';
import { GrMLCompositeNNModel } from './model';
import { GrMLBlock } from '../../core/graphical/blocks';
import {
  GrMLInputBlock,
  GrMLOutputBlock,
} from '../../operations/group';
import { GrMLFunction } from '../../core/function';
import { GrMLCompositeLayer, GrMLCompositeNNBlock } from './blocks';


export class GrMLCompositeNNEditor extends GrMLGraphicalEditor<GrMLCompositeNNModel> {
  public static TAG_NAME = 'grml-composite-editor';
  public readonly propertyEditor = <GrMLPropertyEditor>document.createElement(GrMLPropertyEditor.TAG_NAME);

  constructor (public model: GrMLCompositeNNModel) {
    super(
      {
        'Neurons': [
          GrMLCompositeNNBlock,
          GrMLCompositeLayer,
          GrMLInputBlock,
          GrMLOutputBlock,
        ],
      },
      [
        stylesheet`css/grml-composite-nn-editor.css`,
      ]
    );

    this.shadowRoot?.appendChild(this.zoomWrapper);
    this.shadowRoot?.appendChild(this.brushingContainer);
    const aside = document.createElement('aside');
    aside.appendChild(this.library);
    aside.appendChild(this.propertyEditor);
    this.shadowRoot?.appendChild(aside);
  }

  public onSelect (f: GrMLFunction) {
    this.propertyEditor.props = f.properties;
  }

  public onGroup (bs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }

  public onDuplicate (bs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }

}