import { GrMLModel } from '../../core/model';
import { GrMLHybridTextEditor } from './text-editor';
import { GrMLEditor } from '../../core/editor';

/**
 * Model providing a own text edtitor
 */
export class GrMLTextModel extends GrMLModel {
  public static TYPE = 'grml-text-model';
  public editor: GrMLEditor<GrMLModel> = new GrMLHybridTextEditor(this);
  public name = 'Unnamed Texteditor Pipeline';
  public update () { return; }
}
