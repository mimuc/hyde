import { GrMLApplication } from '../../core/app';
import { GrMLModelLoadEvent } from '../../core/event';
import { GrMLModel } from '../../core/model';
import { stylesheet } from '../../core/util';
import { GrMLPipelineModel } from '../../models/pipeline';
import { GrMLTextModel } from '../models/text-model';

/**
 * The scriptiing GrML application. Embedding this into a HTML document sets up
 * the GrML textual editor
 */
export class GrMLHybridApplication extends GrMLApplication {
  public static TAG_NAME = 'grml-text-app';


  constructor (public model: GrMLModel = new GrMLTextModel()) {
    // switch parent pipeline model with a text model with custom text editor,
    // registers the message handler
    super(model, [ stylesheet`css/grml-text-app.css` ]);

    //TODO: instead of switching the model, switch just the editor within the model?
  }

  public update () {
    return this.activeModel.editor.update();
  }

  /**
   * Overrides handler for when a completely new model is received to replace the old one,
   * such that a textmodel is created instead of a pipeline model.
   * @param {GrMLModel} model new pipeline model
   */
  public onNewModel (model: GrMLModel) {
    if (model instanceof GrMLPipelineModel) { //parse pipeline model to text model
      model = this.parsePipelinemodel(model);
    }

    this.model = model;
    this.activeModel = model;
    this.breadcrumb.path = [ this.model ];
    window.dispatchEvent(new GrMLModelLoadEvent()); // update editor
  }

  /**
   * Parse a pipeline model to a text model with a text editor.
   *
   * @param model pipelineModel
   * @returns textModel with an textEditor
   */
  private parsePipelinemodel (model: GrMLPipelineModel): GrMLTextModel {
    const textModel = new GrMLTextModel();
    textModel.children = model.children;
    return textModel;
  }
}