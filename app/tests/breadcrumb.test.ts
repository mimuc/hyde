import { GrMLModelBreadcrumb } from '../src/core/breadcrumb';
import { GrMLPipelineModel } from '../src/models/pipeline';

describe('GrMLModelBreadcrumb', () => {
  const breadcrumb = <GrMLModelBreadcrumb> document.createElement(GrMLModelBreadcrumb.TAG_NAME);

  test('creation', () => {
    expect(breadcrumb).toBeDefined;
    expect(breadcrumb).toBeInstanceOf(HTMLElement);
  });

  test('setting path', () => {
    const m1 = new GrMLPipelineModel();
    const m2 = new GrMLPipelineModel();
    const m3 = new GrMLPipelineModel();
    const path = [ m1, m2, m3 ];
    breadcrumb.path = path;
    expect(breadcrumb.path.length).toBe(path.length);
    expect(breadcrumb.path.length).toBe(3);
    expect(breadcrumb.path).toEqual(path);
    expect(breadcrumb.path).not.toBe(path);
    expect(breadcrumb.querySelectorAll('a').length).toBe(path.length);
  });

  test('navigation', () => {
    const m1 = new GrMLPipelineModel();
    const path = [ m1 ];
    breadcrumb.path = path;
    const link = breadcrumb.querySelector('a');
    expect(link).toBeDefined;
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    link?.click();
    expect(dispatchSpy).toBeCalledTimes(1);
  });
});
