import { COULD_NOT_LOAD_IMAGE_DATA } from '../src/core/error-reporting';
import {
  GrMLImageFileBlock,
} from '../src/data/img';

describe('Image blocks', () => {
  describe('GrMLImageFileBlock', () => {
    test('can be created', () => {
      const fromConstructor = new GrMLImageFileBlock();
      expect(fromConstructor).toBeDefined;
      expect(fromConstructor).toBeInstanceOf(HTMLElement);
    });

    test('initially has no data', () => {
      const block = new GrMLImageFileBlock();
      const data = block.data();
      expect(data).rejects.toBe([ COULD_NOT_LOAD_IMAGE_DATA ]);
      expect(block.warnings.length).toBeGreaterThan(0);
    });

  });
});