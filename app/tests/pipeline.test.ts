import { GrMLBlock } from '../src/core/blocks';
import { GrMLModel } from '../src/core/model';
import { GrMLBlockLibrary } from '../src/core/library';
import { GrMLProperties } from '../src/core/properties';
import { GrMLCompositeNNBlock } from '../src/models/composite';
import { GrMLPipelineEditor, GrMLPipelineModel, pipelineComponent } from '../src/models/pipeline';
import { GrMLTensorflowDenseLayerBlock } from '../src/models/tf';

describe('GrMLPipelineModel', () => {
  describe('serialization', () => {
    test('An empty GrMLPipelineModel can be serialized', () => {
      const model = new GrMLPipelineModel();
      const serialized = model.serialize();
      expect(serialized).toBeDefined;
      expect(serialized.blocks).toEqual([ ]);
      expect(serialized.name).toBe(model.name);
      expect(serialized.type).toBe(GrMLPipelineModel.TYPE);
    });

    test('Blocks in a GrMLPipelineModel are being serialized', () => {
      const model = new GrMLPipelineModel();
      model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: true });
      const serialized = model.serialize();
      expect(serialized.blocks.length).toBe(1);
      expect(serialized.blocks[0].type.toLowerCase()).toBe(GrMLCompositeNNBlock.TAG_NAME.toLowerCase());
    });

    test('Deserializing a serialized model should yield the original model (empty model)', () => {
      const model = new GrMLPipelineModel();
      const serialized = model.serialize();
      const deserialized = GrMLModel.deserialize(serialized);
      expect(model).toEqual(deserialized);
    });
  });

  describe('Block adding/removal', () => {
    test('Can add a block to a GrMLPipelineModel', () => {
      const model = new GrMLPipelineModel();
      model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: true });
      expect(model.blocks.length).toBe(1);
      expect(model.blocks[0].tagName.toLowerCase()).toBe(GrMLCompositeNNBlock.TAG_NAME.toLowerCase());
      model.addBlock(GrMLCompositeNNBlock.TAG_NAME);
      expect(model.blocks.length).toBe(2);
    });

    test('Can remove a block from a GrMLPipelineModel', () => {
      const model = new GrMLPipelineModel();
      model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: false });
      expect(model.blocks.length).toBe(1);
      expect(model.blocks[0].tagName.toLowerCase()).toBe(GrMLCompositeNNBlock.TAG_NAME.toLowerCase());
      model.removeBlock(model.blocks[0]);
      expect(model.blocks.length).toBe(0);
    });

    test('Cannot remove a protected block from a GrMLPipelineModel', () => {
      const model = new GrMLPipelineModel();
      model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: true });
      expect(model.blocks.length).toBe(1);
      expect(model.blocks[0].tagName.toLowerCase()).toBe(GrMLCompositeNNBlock.TAG_NAME.toLowerCase());
      model.removeBlock(model.blocks[0]);
      expect(model.blocks.length).toBe(1);
    });
  });
});



describe('GrMLPipelineEditor', () => {

  test('After removing a block from a model and updating the editor, the editor should not contain that block', () => {
    const model = new GrMLPipelineModel();
    model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: false });
    expect(model.blocks.length).toBe(1);
    expect(model.blocks[0].tagName.toLowerCase()).toBe(GrMLCompositeNNBlock.TAG_NAME.toLowerCase());
    model.removeBlock(model.blocks[0]);
    expect(model.blocks.length).toBe(0);
    model.editor.update();
    expect(model.editor.shadowRoot?.querySelector('.zoom-wrapper')?.innerHTML.trim()).toBe('');
  });

  test('Adding blocks to the pipeline editor works with the pipeline component decorator', () => {
    @pipelineComponent()
    class A extends GrMLBlock {
      public static TAG_NAME = 'A';
      public properties: GrMLProperties = { };
      public data(): Promise<any[]> {
        throw new Error('Method not implemented.');
      }
    }

    const TEST_CATEGORY = 'TEST CATEGORY';
    @pipelineComponent(TEST_CATEGORY)
    class B extends GrMLBlock {
      public static TAG_NAME = 'B';
      public properties: GrMLProperties = { };
      public data(): Promise<any[]> {
        throw new Error('Method not implemented.');
      }
    }
    const p = new GrMLPipelineEditor(new GrMLPipelineModel());

    expect(p.library.AVAILABLE_BLOCKS[GrMLBlockLibrary.MISC_LABEL]).toBeDefined;
    expect(p.library.AVAILABLE_BLOCKS[TEST_CATEGORY]).toBeDefined;
    expect(p.library.AVAILABLE_BLOCKS[GrMLBlockLibrary.MISC_LABEL][A.TAG_NAME]).toBe(A);
    expect(p.library.AVAILABLE_BLOCKS[TEST_CATEGORY][B.TAG_NAME]).toBe(B);
  });

  test('Selecting a block in the editor highlights it', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    const model = new GrMLPipelineModel();
    model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: false });
    model.addBlock(GrMLCompositeNNBlock.TAG_NAME, { protected: false });
    model.blocks[0].click();
    expect(dispatchEventSpy).toBeCalled;
    expect(model.blocks[0].classList.contains('selected')).toBeTruthy;
    expect(model.blocks[1].classList.contains('selected')).toBeFalsy;
    model.editor.onSelect(model.blocks[1]);
    expect(model.blocks[0].classList.contains('selected')).toBeFalsy;
    expect(model.blocks[1].classList.contains('selected')).toBeTruthy;
  });

  test('Selecting a block updates the property editor', () => {
    const model = new GrMLPipelineModel();
    model.addBlock(GrMLTensorflowDenseLayerBlock.TAG_NAME, { protected: false });
    model.addBlock(GrMLTensorflowDenseLayerBlock.TAG_NAME, { protected: false });
    model.blocks[0].click();
    const editor = <GrMLPipelineEditor> model.editor;
    // expect(editor.propertyEditor.props).toBe(model.blocks[0].properties); // FIXME
    editor.onSelect(model.blocks[1]);
    expect(editor.propertyEditor.props).toBe(model.blocks[1].properties);
  });

});






