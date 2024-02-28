import { GrMLModel } from '../src/core/model';
import { GrMLPipelineModel } from '../src/models/pipeline';
import { GrMLModelSerialization } from '../src/core/serializable.interface';

describe('GrMLModel deserialization', () => {

  test('Emtpy string cannot be deserialized', () => {
    expect(() => GrMLModel.deserialize('')).toThrowError();
  });

  test('Any non object string cannot be deserialized', () => {
    const serializationSpy = jest.spyOn(GrMLModel, 'deserialize');
    expect(() => GrMLModel.deserialize('[ ]')).toThrowError();
    expect(() => GrMLModel.deserialize('5')).toThrowError();
    expect(() => GrMLModel.deserialize('"object"')).toThrowError();
    expect(serializationSpy).toBeCalledTimes(3);
  });

  test('Emtpy object cannot be deserialized', () => {
    expect(() => GrMLModel.deserialize(<GrMLModelSerialization> { })).toThrowError();
  });

  test('Unknown model type cannot be deserialized', () => {
    expect(() => GrMLModel.deserialize({ type: 'unknown type', name: 'b', blocks: [ ] })).toThrowError();
  });

  test('String representation of a serialized model can be deserialized to that GrMLModel', () => {
    const model = new GrMLPipelineModel();
    const serialized = model.serialize();
    const asString = JSON.stringify(serialized);
    const deserialized = GrMLModel.deserialize(asString);
    expect(model).toEqual(deserialized);
  });
});
