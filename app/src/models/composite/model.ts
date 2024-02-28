import { GrMLEditor } from '../../core/editor';
import { GrMLCompositeNNEditor } from './editor';
import { GrMLModel } from '../../core/model';

export class GrMLCompositeNNModel extends GrMLModel {
  public static TYPE = 'grml-composite-model';
  public editor: GrMLEditor<GrMLModel> = new GrMLCompositeNNEditor(this);
  public name = 'Composite Model';
  public update () { return; }
}
