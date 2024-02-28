import { GrMLBlockLibrary } from '../src/core/library';
import { GrMLCompositeNNBlock } from '../src/models/composite';
import { GrMLInputBlock } from '../src/operations/group';


describe('GrMLBlockLibrary', () => {
  describe('Registration of blocks', () => {
    test('For each registered block there is a list item', () => {
      const lib = new GrMLBlockLibrary();
      lib.register(GrMLCompositeNNBlock);
      lib.update();
      expect(lib.shadowRoot?.querySelectorAll('grml-collapsible li')?.length).toBe(1);
      expect(lib.shadowRoot?.querySelectorAll('#library > div')?.length).toBe(1);
      lib.register(GrMLInputBlock, 0);
      lib.update();
      expect(lib.shadowRoot?.querySelectorAll('grml-collapsible li')?.length).toBe(2);
      expect(lib.shadowRoot?.querySelectorAll('#library > div')?.length).toBe(1);
      lib.register(GrMLCompositeNNBlock, 'Other');
      lib.update();
      expect(lib.shadowRoot?.querySelectorAll('grml-collapsible li')?.length).toBe(3);
      expect(lib.shadowRoot?.querySelectorAll('#library > div')?.length).toBe(2);
    });
  });
});
