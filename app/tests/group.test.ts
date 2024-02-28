import { GrMLGroupBlock, GrMLOutputBlock } from '../src/operations/group';
import { GrMLInputBlock } from '../src/operations/group';

describe('GrMLInputBlock', () => {
  const byConstructor = new GrMLInputBlock();
  const byDocument = document.createElement(GrMLInputBlock.TAG_NAME);

  test('GrMLCompositeNNInputBlock can be created', () => {
    expect(byConstructor).toBeDefined;
    expect(byConstructor).toBeInstanceOf(HTMLElement);
    expect(byDocument).toBeDefined;
    expect(byDocument).toBeInstanceOf(HTMLElement);
  });

  test('GrMLInputBlock has empty properties', () => {
    expect((new GrMLInputBlock()).properties).toEqual({ });
  });

});


describe('GrMLOutputBlock', () => {
  const byConstructor = new GrMLOutputBlock();
  const byDocument = document.createElement(GrMLOutputBlock.TAG_NAME);

  test('GrMLCompositeNNOutputBlock can be created', () => {
    expect(byConstructor).toBeDefined;
    expect(byConstructor).toBeInstanceOf(HTMLElement);
    expect(byDocument).toBeDefined;
    expect(byDocument).toBeInstanceOf(HTMLElement);
  });

  test('GrMLOutputBlock has empty properties', () => {
    expect((new GrMLOutputBlock()).properties).toEqual({ });
  });
});

describe('GrMLGroupBlock port behavior', () => {

  test('Adding I/O blocks increases the number of ports', () => {
    const block = new GrMLGroupBlock();
    block.model.addBlock(GrMLInputBlock.TAG_NAME);
    expect(block.model.blocks.length).toBe(1);
    block.update();
    expect(block.inputs.length).toBe(1);

    block.model.addBlock(GrMLOutputBlock.TAG_NAME);
    expect(block.model.blocks.length).toBe(2);
    block.update();
    expect(block.outputs.length).toBe(1);
  });

  test('Removing I/O ports decreases the number of ports', () => {
    const block = new GrMLGroupBlock();
    block.model.addBlock(GrMLInputBlock.TAG_NAME);
    expect(block.model.blocks.length).toBe(1);
    block.model.addBlock(GrMLOutputBlock.TAG_NAME);
    expect(block.model.blocks.length).toBe(2);
    block.update();
    block.model.removeBlock(block.model.blocks[0]);
    expect(block.model.blocks.length).toBe(1);
    block.update();
    expect(block.inputs.length).toBe(0);

    block.model.removeBlock(block.model.blocks[0]);
    expect(block.model.blocks.length).toBe(0);
    block.update();
    expect(block.outputs.length).toBe(0);
  });
});
