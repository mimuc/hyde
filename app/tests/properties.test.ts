import { GrMLPropertyEditor, GrMLPropertyType } from '../src/core/properties';


describe('GrMLPropertyEditor', () => {

  test('can be created', () => {
    const fromTag = document.createElement(GrMLPropertyEditor.TAG_NAME);
    const fromConstructor = new GrMLPropertyEditor();

    expect(fromTag).toBeDefined;
    expect(fromTag).toBeInstanceOf(HTMLElement);
    expect(fromConstructor).toBeDefined;
    expect(fromConstructor).toBeInstanceOf(HTMLElement);
    expect(fromTag).toEqual(fromConstructor);
  });

  test('accepts string properties', () => {
    const editor = new GrMLPropertyEditor();
    editor.props = {
      string: {
        type: GrMLPropertyType.STRING,
        label: 'String',
      }
    };
    expect(editor.shadowRoot?.querySelector('ul')?.children.length).toBe(1);
  });

  test('accepts code properties', () => {
    const editor = new GrMLPropertyEditor();
    editor.props = {
      string: {
        type: GrMLPropertyType.CODE,
        label: 'code',
      }
    };
    expect(editor.shadowRoot?.querySelector('ul')?.children.length).toBe(1);
  });

  test('accepts number properties', () => {
    const editor = new GrMLPropertyEditor();
    editor.props = {
      string: {
        type: GrMLPropertyType.NUMBER,
        label: 'number',
      }
    };
    expect(editor.shadowRoot?.querySelector('ul')?.children.length).toBe(1);
  });

  test('accepts URL properties', () => {
    const editor = new GrMLPropertyEditor();
    editor.props = {
      string: {
        type: GrMLPropertyType.URL,
        label: 'URL',
      }
    };
    expect(editor.shadowRoot?.querySelector('ul')?.children.length).toBe(1);
  });

});