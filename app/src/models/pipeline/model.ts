import { GrMLEditor } from '../../core/editor';
import { GrMLModel } from '../../core/model';
import { GrMLPipelineEditor } from './editor';


export class GrMLPipelineModel extends GrMLModel {
  public static TYPE = 'grml-pipeline-model';
  public editor: GrMLEditor<GrMLModel> = new GrMLPipelineEditor(this);
  public name = 'Unnamed Pipeline';
  public update () { return; }
}
