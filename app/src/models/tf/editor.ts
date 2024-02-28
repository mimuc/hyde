import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLGraphicalEditor } from '../../core/editor';
import { stylesheet } from '../../core/util';
import { GrMLTensorflowSequentialModel } from './model';

export class GrMLTensorflowSequentialEditor extends GrMLGraphicalEditor<GrMLTensorflowSequentialModel> {
  public static TAG_NAME = 'grml-tf-sequential-editor';

  constructor (
    public model: GrMLTensorflowSequentialModel,
    settings?: {
      ioPorts?: boolean,
      layers: any[],
    },
  ) {
    super(
      {
        'Transformation': settings?.layers || [ ],
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

  public onGroup (bs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }

  public onDuplicate (bs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }
}
