import { GrMLBlock } from '../src/core/blocks';
import { GrMLBlockSerialization } from '../src/core/serializable.interface';
import { GrMLGroupBlock, GrMLInputBlock } from '../src/operations/group';

describe('GrMLBlock', () => {
  const b = new GrMLInputBlock();
  const mb = new GrMLGroupBlock();

  test('Emtpy string cannot be deserialized', () => {
    expect(() => GrMLBlock.deserialize('')).toThrowError();
  });

  test('Any non object string cannot be deserialized', () => {
    const serializationSpy = jest.spyOn(GrMLBlock, 'deserialize');
    expect(() => GrMLBlock.deserialize('[ ]')).toThrowError();
    expect(() => GrMLBlock.deserialize('5')).toThrowError();
    expect(() => GrMLBlock.deserialize('"object"')).toThrowError();
    expect(serializationSpy).toBeCalledTimes(3);
  });

  test('Emtpy object cannot be deserialized', () => {
    expect(() => GrMLBlock.deserialize(<GrMLBlockSerialization> { })).toThrowError();
  });

  test('Unknown model type cannot be deserialized', () => {
    expect(() => GrMLBlock.deserialize({
      type: 'unknown block',
      name: 'b',
      inputs: [ ],
      outputs: [ ],
      locked: false,
      position: { x: '0', y: '0' },
      properties: { },
      protected: false,
      sources: [ ],
      uuid: '',
    })).toThrowError();
  });

  describe('deserialization', () => {
    test('Deserializing a serialized GrMLBlock returns an equivalent new block', () => {
      b.update();
      const serialized = b.serialize();
      const deserialized = <GrMLInputBlock> GrMLBlock.deserialize(serialized);
      deserialized.update();

      expect(deserialized.tagName).toBe(b.tagName);
      expect(deserialized.uuid).toBe(b.uuid);
      expect(deserialized.name).toBe(b.name);
      expect(deserialized.inputs.length).toEqual(b.inputs.length);
      expect(deserialized.outputs.length).toEqual(b.outputs.length);
      expect((<any> deserialized).x).toBe((<any> b).x);
      expect((<any> deserialized).y).toBe((<any> b).y);
    });

    test('Deserializing a serialized GrMLModelBlock returns an equivalent new block', () => {
      mb.update();
      const serialized = mb.serialize();
      const deserialized = <GrMLInputBlock> GrMLBlock.deserialize(serialized);
      deserialized.update();

      expect(deserialized.tagName).toBe(mb.tagName);
      expect(deserialized.uuid).toBe(mb.uuid);
      expect(deserialized.name).toBe(mb.name);
      expect(deserialized.inputs.length).toEqual(mb.inputs.length);
      expect(deserialized.outputs.length).toEqual(mb.outputs.length);
      expect((<any> deserialized).x).toBe((<any> mb).x);
      expect((<any> deserialized).y).toBe((<any> mb).y);
    });
  });
});