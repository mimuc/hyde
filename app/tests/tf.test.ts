import { NO_DATA_FOUND_RESPONSE } from '../src/core/error-reporting';
import {
  GrMLTensorflowDenseLayerBlock,
  GrMLTensorflowSequentialEditor,
  GrMLTensorflowSequentialModel,
  GrMLTensorflowSequentialModelBlock,
} from '../src/models/tf';
import { GrMLInputBlock, GrMLOutputBlock } from '../src/operations/group';

describe('GrML Tensorflow implementation', () => {
  describe('GrMLTensorflowSequentialModelBlock', () => {
    const byConstructor = new GrMLTensorflowSequentialModelBlock();
    const byDocument = document.createElement(GrMLTensorflowSequentialModelBlock.TAG_NAME);
    const block = byConstructor;
    const updateSpy = jest.spyOn(block, 'update');

    test('GrMLTensorflowSequentialModelBlock can be created', () => {
      expect(byConstructor).toBeDefined;
      expect(byConstructor).toBeInstanceOf(HTMLElement);
      expect(byDocument).toBeDefined;
      expect(byDocument).toBeInstanceOf(HTMLElement);
    });

    test('GrMLTensorflowSequentialModelBlock has empty properties', () => {
      expect((new GrMLTensorflowSequentialModelBlock()).properties).toEqual({ });
    });

    test('GrMLTensorflowSequentialBlock can be updated', () => {
      block.update();
      expect(updateSpy).toBeCalledTimes(1);
      expect(updateSpy).toReturnTimes(1);
    });
  });

  describe('GrMLTensorflowSequentialModel', () => {
    const model = new GrMLTensorflowSequentialModel();

    test('GrMLTensorflowSequentialModel can be created', () => {
      expect(model).toBeDefined;
    });

    test('GrMLTensorflowSequentialModel has an editor', () => {
      expect(model.editor).toBeDefined;
      expect(model.editor).toBeInstanceOf(HTMLElement);
      expect(model.editor).toBeInstanceOf(GrMLTensorflowSequentialEditor);
    });

    test('GrMLTensorflowSequentialModel has one protected input and output', () => {
      expect(model.blocks.length).toBe(2);
      expect(model.blocks[0]).toBeInstanceOf(GrMLInputBlock);
      expect(model.blocks[0].protected).toBeTruthy;
      expect(model.blocks[1]).toBeInstanceOf(GrMLOutputBlock);
      expect(model.blocks[1].protected).toBeTruthy;
    });

    describe('Model construction', () => {
      test('A new GrMLTensorflowSequentialModel has no model', () => {
        const b = new GrMLTensorflowSequentialModelBlock();
        const m = <GrMLTensorflowSequentialModel> b.model;
        expect(m.model).toBeNull;
        m.update();
        expect(m.model).toBeNull;
        expect(m.parent);
      });
    });
  });

  describe('GrML Tensorflow Layers', () => {

    describe('GrMLTensorflowDenseLayerBlock', () => {
      test('Can be created', () => {
        const fromConstructor = new GrMLTensorflowDenseLayerBlock();
        const fromDocument = document.createElement(GrMLTensorflowDenseLayerBlock .TAG_NAME);

        expect(fromConstructor).toBeDefined;
        expect(fromDocument).toBeDefined;
      });

      test('Yields no data without attached input', () => {
        const block = new GrMLTensorflowDenseLayerBlock();

        expect(block.data()).resolves.toEqual(NO_DATA_FOUND_RESPONSE);
      });
    });
  });
});
