import { GrMLCollapsible } from '../src/elements/collapsible';

describe('GrMLCollapsible', () => {
  const collapsible = new GrMLCollapsible();
  const attrChangeSpy = jest.spyOn(collapsible, 'attributeChangedCallback');

  test('GrMLCollapsible can be created', () => {
    expect(collapsible).toBeDefined;
    expect(collapsible).toBeInstanceOf(HTMLElement);
  });

  test('GrMLCollapsible can be added to the DOM', () => {
    document.body.appendChild(collapsible);
    expect(collapsible.parentElement).toBe(document.body);
  });

  describe('collapse behavior', () => {
    test('click to open/close', () => {
      const handle = document.createElement('div');
      handle.id = 'testHandle';
      collapsible.parentElement?.ownerDocument.body.appendChild(handle);
      collapsible.setAttribute('handle', handle.id);
      handle.click();
      expect(collapsible.classList.contains('hidden')).toBeFalsy;
      handle.click();
      expect(collapsible.classList.contains('hidden')).toBeTruthy;
    });
  });

  test('replacing the handle', () => {
    const handle = document.createElement('div');
    handle.id = 'testHandle';
    const newHandle = document.createElement('div');
    newHandle.id = 'newTestHandle';
    collapsible.parentElement?.ownerDocument.body.append(handle, newHandle);

    collapsible.setAttribute('handle', handle.id);

    handle.click();
    expect(collapsible.classList.contains('hidden')).toBeFalsy;

    collapsible.setAttribute('handle', newHandle.id);

    handle.click();
    expect(collapsible.classList.contains('hidden')).toBeFalsy;

    newHandle.click();
    expect(collapsible.classList.contains('hidden')).toBeTruthy;

    newHandle.click();
    expect(collapsible.classList.contains('hidden')).toBeFalsy;

  });
});
