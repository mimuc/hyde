import { GrMLApplication } from './core/app';
import { GrMLBlockLibrary } from './core/graphical/library';
import { GrMLCollapsible } from './elements/collapsible';
import {
  GrMLPipelineEditor,
  GrMLPipelineModel,
} from './models/pipeline';
import { GrMLPropertyEditor } from './core/properties';
import { GrMLBootstrapEvent } from './core/event';
import { consoleLabelStyle } from './core/util';
import {
  GrMLCompositeLayer,
  GrMLCompositeNeuron,
  GrMLCompositeNNBlock,
  GrMLCompositeNNEditor,
  GrMLCompositeNNModel,
} from './models/composite';
import { GrMLModelBreadcrumb } from './core/breadcrumb';
import { CatDogDataSetBlock, GrMLImageSetPreview } from './data/datasets/pets';
import {
  GrMLImageFileBlock,
  GrMLImageLoaderBlock,
} from './data/img';
import {
  GrMLTensorflowSequentialEditor,
  GrMLTensorflowSequentialModel,
  MockModelFunction,
} from './models/tf';
import { GrMLInferenceFunction } from './data/inference';
import { GrMLTooltip } from './elements/tooltip';
import { GrMLOverlay } from './elements/overlay';
import { GrMLTrainTestSplitFunction } from './operations/train-test-split';
import { GrMLValidationFunction } from './operations/validation';
import { GrMLGroupBlock } from './operations/group';
import { GrMLMinstDataFunction } from './data/datasets/mnist';
import { GrMLHybridApplication } from './hybrid/core/text-app';
import { GrMLHybridTextEditor } from './hybrid/models/text-editor';
import { GrMLLineEnumeration } from './hybrid/core/line-enumeration';
import { GrMLCodeSnippet } from './core/textual/code-snippet';
import { GrMLBootstrapper } from './core/bootstrapping';
import { GrMLTensorFlowSequentialFunction } from './models/tf/functions/sequential';
import { GrMLTensorFlowFlattenFunction } from './models/tf/functions/flatten';
import { GrMLTensorflowDenseLayerFunction } from './models/tf/functions/dense';
import { GrMLModel } from './core/model';
import { GrMLModelFunction } from './core/function';
import { GrMLInputFunction, GrMLOutputFunction } from './models/composite/functions/functionIO';
import { GrMLTensorflowNormalizeFunction } from './models/tf/functions/normalize';
import { GrMLTensorflowShuffleLayerFunction } from './models/tf/functions/shuffle';
import { GrMLMnistDrawFunction } from './data/datasets/mnist-draw';
import { GrMLCustomFunction } from './hybrid/models/functions/custom';
import { GrMLToolbar } from './core/textual/toolbar';
import { GrMLModelBlock } from './core/graphical/blocks';
import { GrMLTensorflowTrainFunction } from './models/tf/train';

window.addEventListener('message', (message) => {
  console.warn(
    '%cMessage',
    consoleLabelStyle('rgb(0, 136, 255)'),
    message
  );
});


GrMLBootstrapper.bootstrap({
  blocks: [
    GrMLGroupBlock,
    GrMLInputFunction.Block,
    GrMLOutputFunction.Block,
    GrMLCompositeNNBlock,
    GrMLCompositeLayer,
    GrMLCompositeNeuron,
    GrMLImageLoaderBlock,
    GrMLImageFileBlock,
    CatDogDataSetBlock,
    GrMLTrainTestSplitFunction.Block,
    GrMLInferenceFunction.Block,
    GrMLMinstDataFunction.Block,
    GrMLMnistDrawFunction.Block,
    GrMLValidationFunction.Block,
    GrMLCustomFunction.Block,

    GrMLTensorflowNormalizeFunction.Block,
    GrMLTensorflowShuffleLayerFunction.Block,
    GrMLTensorFlowSequentialFunction.Block,
    GrMLTensorFlowFlattenFunction.Block,
    GrMLTensorflowDenseLayerFunction.Block,
    GrMLTensorflowTrainFunction.Block,

    MockModelFunction.Block,
  ],
  functions: [
    GrMLValidationFunction,
    GrMLInferenceFunction,
    GrMLMinstDataFunction,
    GrMLMnistDrawFunction,
    GrMLTrainTestSplitFunction,

    GrMLCustomFunction,
    GrMLTensorflowNormalizeFunction,
    GrMLTensorflowShuffleLayerFunction,
    GrMLTensorFlowSequentialFunction,
    GrMLTensorFlowFlattenFunction,
    GrMLTensorflowDenseLayerFunction,
    GrMLOutputFunction,
    GrMLInputFunction,
    GrMLModelFunction,
    GrMLTensorflowTrainFunction,

    MockModelFunction,
  ],
  models: [
    GrMLPipelineModel,
    GrMLCompositeNNModel,
    GrMLTensorflowSequentialModel,
    GrMLModel
  ],
  elements: [
    [ GrMLApplication.TAG_NAME, GrMLApplication ],
    [ GrMLModelBreadcrumb.TAG_NAME, GrMLModelBreadcrumb ],
    [ GrMLToolbar.TAG_NAME, GrMLToolbar ],
    [ GrMLBlockLibrary.TAG_NAME, GrMLBlockLibrary ],
    [ 'grml-collapsible', GrMLCollapsible ],
    [ GrMLPipelineEditor.TAG_NAME, GrMLPipelineEditor ],
    [ GrMLCompositeNNEditor.TAG_NAME, GrMLCompositeNNEditor ],
    [ GrMLPropertyEditor.TAG_NAME, GrMLPropertyEditor ],
    [ GrMLTensorflowSequentialEditor.TAG_NAME, GrMLTensorflowSequentialEditor ],
    [ GrMLTooltip.TAG_NAME, GrMLTooltip ],
    [ 'grml-overlay', GrMLOverlay ],
    [ GrMLImageSetPreview.TAG_NAME, GrMLImageSetPreview ],
    [ 'grml-custom-code-snippet' , GrMLCustomFunction.CodeSnippet ],
    [ 'grml-validation-code-snippet' , GrMLValidationFunction.CodeSnippet ],
    [ 'grml-inference-code-snippet' , GrMLInferenceFunction.CodeSnippet ],
    [ 'grml-train-test-split-code-snippet' , GrMLTrainTestSplitFunction.CodeSnippet ],
    [ 'grml-mnist-code-snippet' , GrMLMinstDataFunction.CodeSnippet ],
    [ 'grml-tf-sequential-code-snippet' , GrMLTensorFlowSequentialFunction.CodeSnippet ],
    [ 'grml-tf-flatten-code-snippet' , GrMLTensorFlowFlattenFunction.CodeSnippet ],
    [ 'grml-tf-layers-dense-code-snippet' , GrMLTensorflowDenseLayerFunction.CodeSnippet ],
    [ 'grml-tf-actions-normalize-code-snippet', GrMLTensorflowNormalizeFunction.CodeSnippet ],
    [ 'grml-tf-actions-shuffle-code-snippet', GrMLTensorflowShuffleLayerFunction.CodeSnippet ],
    [ 'grml-tf-train-code-snippet' , GrMLTensorflowTrainFunction.CodeSnippet ],
    [ GrMLHybridApplication.TAG_NAME, GrMLHybridApplication ],
    [ GrMLHybridTextEditor.TAG_NAME, GrMLHybridTextEditor ],
    [ GrMLLineEnumeration.TAG_NAME, GrMLLineEnumeration ],
    [ GrMLCodeSnippet.TAG_NAME, GrMLCodeSnippet ],
    [ 'grml-mock-code-snippet', MockModelFunction.CodeSnippet ],
  ],
});

window.dispatchEvent(new GrMLBootstrapEvent());
