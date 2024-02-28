import { GrMLApplication } from '../src/core/app';
import { GrMLModelBreadcrumb } from '../src/core/breadcrumb';
import { GrMLCompositeNNModel } from '../src/models/composite';
import { GrMLPipelineEditor, GrMLPipelineModel } from '../src/models/pipeline';


describe('GrMLApplication', () => {
  const app = <GrMLApplication> document.createElement(GrMLApplication.TAG_NAME);
  const onInitSpy = jest.spyOn(app, 'onInit');

  test('GrMLApplication can be created', () => {
    expect(app).toBeDefined;
  });

  test('GrMLApplication has a uuid', () => {
    expect(app.uuid).toBeDefined;
    expect(app.uuid).toBeTruthy;
    expect(app.uuid).not.toBe('');
  });

  test('Altering GrMLApplications uuid changes its element id', () => {
    expect(app.uuid).toBe(app.id);
    const prevUUID = app.uuid;
    app.uuid = 'test';
    expect(app.id).toBe('test');
    expect(app.uuid).toBe(app.id);
    app.uuid = prevUUID;
    expect(app.id).toBe(prevUUID);
    expect(app.uuid).toBe(app.id);
  });

  test('GrMLApplication is a HTML element.', () => {
    expect(app).toBeInstanceOf(HTMLElement);
  });

  test('GrMLApplication contains a PipelineMode by default.', async () => {
    expect(app.model).toBeDefined;
    expect(app.model).toBeInstanceOf(GrMLPipelineModel);
    expect(app.activeModel).toBeDefined
    expect(app.activeModel).toBeInstanceOf(GrMLPipelineModel);
  });

  test('GrMLApplication contains an PipeLineEditor.', () => {
    expect(app.editor).toBeDefined;
    expect(app.editor).toBeInstanceOf(GrMLPipelineEditor);
  });

  test('GrMLApplication: replacing the model replaces the model and editor', () => {
    const model = new GrMLCompositeNNModel();
    app.activeModel = model;
    expect(app.activeModel).toBe(model);
    expect(app.editor).toBe(model.editor);
  });

  test('GrMLApplication.onInit can be called without errors.', () => {
    app.onInit();
    expect(onInitSpy).toBeCalledTimes(1);
    expect(onInitSpy).toReturnTimes(1);
  });

  describe('onNewModel method', () => {
    const m = new GrMLPipelineModel();
    test('can be called', () => {
      const onNewModelSpy = jest.spyOn(app, 'onNewModel');
      app.onNewModel(m);
      expect(onNewModelSpy).toBeCalledTimes(1);
    });

    test('updates the breadcrumb', () => {
      app.onNewModel(m);
      expect((<GrMLModelBreadcrumb> app.shadowRoot?.querySelector(GrMLModelBreadcrumb.TAG_NAME)).path[0])
        .toBe(m);
    });
  });

  describe('Breadcrumb navigation', () => {
    const bc = <GrMLModelBreadcrumb> app.shadowRoot?.querySelector(GrMLModelBreadcrumb.TAG_NAME);

    test('exists', () => {
      expect(bc).toBeDefined;
      expect(bc).toBeInstanceOf(HTMLElement);
    });

    test('has a path', () => {
      expect(bc.path).toBeDefined;
      expect(bc.path).toBeInstanceOf(Array);
      expect(bc.path.length).toBeDefined;
    });

    test('path can be replaced', () => {
      bc.path = [ app.model ];
      expect(bc.path.length).toBe(1);
      expect(bc.path[0]).toBe(app.model);
    });

    test('has as many links as path elements', () => {
      bc.path = [ app.model ];
      expect(bc.querySelectorAll('a').length).toBe(bc.path.length);
    });
  });
});
