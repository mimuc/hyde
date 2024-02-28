import {
  GrMLCompositeNeuron,
  GrMLCompositeNNBlock,
} from '../src/models/composite';


describe('GrMLCompositeNeuron', () => {
  const byConstructor = new GrMLCompositeNeuron();
  const byDocument = document.createElement(GrMLCompositeNeuron.TAG_NAME);

  test('GrMLCompositeNeuron can be created', () => {
    expect(byConstructor).toBeDefined;
    expect(byConstructor).toBeInstanceOf(HTMLElement);
    expect(byDocument).toBeDefined;
    expect(byDocument).toBeInstanceOf(HTMLElement);
  });

  test('GrMLCompositeNeuron has empty properties', () => {
    expect((new GrMLCompositeNeuron()).properties).toEqual({ });
  });
});
