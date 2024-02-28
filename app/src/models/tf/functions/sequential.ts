import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLProperties } from '../../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../../core/representation';
import { GrMLCodeSnippet } from '../../../core/textual/code-snippet';

import * as tf from '@tensorflow/tfjs';
import { GrMLConsole } from '../../../core/console';
import { HasWarnings, MODEL_INCOMPLETE, NO_DATA_FROM_INPUT, Warning } from '../../../core/error-reporting';
import { GrMLTensorflowSequentialModel } from '../model';
import { pipelineComponent } from '../../pipeline';
import { GrMLExecuteCodeEvent, GrMLSubModelSelectedEvent } from '../../../core/event';
import { GrMLCompositeNNFunction } from '../../composite/functions/compositeNN';
import { GrMLModel } from '../../../core/model';

/**
 * Sequential model.
 */
@pipelineComponent('Tensorflow')
export class GrMLTensorFlowSequentialFunction extends GrMLCompositeNNFunction implements HasBlockRepresentation, HasCodeRepresentation, HasWarnings {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-tf-sequential';

    constructor (public parent: GrMLTensorFlowSequentialFunction) {
      super(parent);
      const core = this.shadowRoot?.querySelector('.core');
      if (core) {
        const loadingIndicator = document.createElement('span');
        loadingIndicator.innerText = 'Training...';
        loadingIndicator.style.display = 'none';
      }

      // append icon to block
      const img = <HTMLImageElement> this.shadowRoot?.querySelector('.header img');
      if (img) {
        img.src = 'img/icons/composite.svg';
      }

      // open model on double click
      this.addEventListener(
        'dblclick',
        () => {
          window.dispatchEvent(new GrMLSubModelSelectedEvent(this.parent.model.path));
          (<GrMLTensorflowSequentialModel> this.parent.model).createInputFunction();
        }
      );
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    public closure: ShadowRoot | undefined;
    constructor (public parent: GrMLTensorFlowSequentialFunction) {
      super(parent, 'tf.sequential', (paramNames, retNames, properties) => [
        `${retNames[ 0 ]} = tf.keras.models.Sequential([`,
      ]);

      // create and append a closure
      const closureDiv = document.createElement('div');
      closureDiv.id = `closure-${this.parent.returnValues[ 0 ].name}`;
      closureDiv.classList.add('closure');
      this.container?.appendChild(closureDiv); // append closure element to code snippet
      this.closure = closureDiv?.attachShadow({ mode: 'open' }); // new shadow root to attach code of model-layers to

      // FIXME: update code on change of parameters, allow editing
      const end = document.createElement('pre');
      const endTemplate = [ '])',
        'loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)',
        `${this.parent.returnValues[0].name}.compile(optimizer='adam', loss=loss_fn, metrics=['accuracy'])`,

        `${this.parent.returnValues[ 0 ].name}.fit(`,
        `    ${this.parent.parameters[ 0 ]?.name || 'training_data'},`,
        '    epochs=6,',
        ')',
      ];
      end.innerText = endTemplate.join('\n');
      this.container?.append(end);
    }



    public get code (): string {
      const sequentialModel = (<GrMLTensorflowSequentialModel>(<GrMLTensorFlowSequentialFunction>this.parent).model);

      // update to get actual layers
      sequentialModel.update();
      const layersCode = sequentialModel.layers.map(layer => (layer.representations['CODE'] as GrMLCodeSnippet).code).join('\n');

      return (this.codefield?.innerText || '') + layersCode + this.endTemplate;
    }

    public set code (code: string) {
      if (this.codefield) {
        this.codefield.innerHTML = code;
      }
    }
  };

  public static NAME = 'tf.sequential';
  public static VERBOSE_NAME = 'tf.sequential';
  public static DESCRIPTION = 'Combines multiple layers into a model.';

  public executable = true;

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [ REPRESENTATION_TYPES.BLOCK ]: new GrMLTensorFlowSequentialFunction.Block(this),
    [ REPRESENTATION_TYPES.CODE ]: new GrMLTensorFlowSequentialFunction.CodeSnippet(this),
  };
  public properties: GrMLProperties = {};

  constructor (parent: GrMLModel) {
    super(GrMLTensorFlowSequentialFunction.VERBOSE_NAME, new GrMLTensorflowSequentialModel());
    this.model.parent = this; // set function as parent of the model (needed for breadcrumb and closure)

    // in text representation override editor (needed for updating the closure)
    if (parent.editor.REPRESENTATION_TYPE === REPRESENTATION_TYPES.CODE) {
      this.model.editor = parent.editor;
    }
  }


  public async execute () {
    this.train();
  }

  public train () {
    // TODO: Flo probably remove train function since it will be done in python
    try {
      this.model.update();
    } catch (e) {
      GrMLConsole.error(e);
    }
  }

  public renameVariable (oldName: string, newName: string): void {
    this.codeEditTimestamp = new Date();

    const alreadyComputed = this.codeEditTimestampWhenComputed ? this.codeEditTimestampWhenComputed.getMilliseconds() > 0 : false;

    if (oldName !== '' && oldName !== newName && alreadyComputed) {
      const pyCodeChangeVarName = `${newName} = tf.keras.models.clone_model(${oldName})`;
      window.dispatchEvent(new GrMLExecuteCodeEvent(pyCodeChangeVarName));
    }
  }

}