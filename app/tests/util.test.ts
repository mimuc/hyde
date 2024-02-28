import { draggable, inlineStyle } from '../src/core/util';

test('inlineStyle yields a style element', () => {
  const s = inlineStyle`body { display: block; }`;
  expect(s).toBeInstanceOf(HTMLElement);
  expect(s.tagName.toLowerCase()).toBe('style');
});


describe('draggable decorator', () => {
  describe('without options', () => {
    @draggable()
    class DemoClass extends HTMLElement { }
    customElements.define('demo-class', DemoClass);

    test('class instances have an x/y attribute', () => {
      const instance = new DemoClass();
      expect(instance.hasAttribute('x')).toBeTruthy;
      expect(instance.hasAttribute('y')).toBeTruthy;
    });

    test('setting x/y updates attributes and style', () => {
      const instance = <any> new DemoClass();
      instance.x = 5;
      instance.y = 7;
      expect(instance.getAttribute('x')).toBe('5');
      expect(instance.getAttribute('y')).toBe('7');
      expect(instance.style.left).toBe('5px');
      expect(instance.style.top).toBe('7px');

      instance.x = -5;
      instance.y = -7;
      expect(instance.getAttribute('x')).toBe('-5');
      expect(instance.getAttribute('y')).toBe('-7');
      expect(instance.style.right).toBe('-5px');
      expect(instance.style.bottom).toBe('-7px');
    });
  });

  describe('with options', () => {
    test('stick draggables end up at their stick position', () => {
      @draggable({
        sticky: { x: 10, y: 25 },
      })
      class StickClass extends HTMLElement { }
      customElements.define('sticky-class', StickClass);


      const instance = <any> new StickClass();
      instance.x = 5;
      instance.y = 7;
      expect(instance.getAttribute('x')).toBe('10');
      expect(instance.getAttribute('y')).toBe('25');
      expect(instance.style.left).toBe('10px');
      expect(instance.style.top).toBe('25px');

      instance.x = -5;
      instance.y = -7;
      expect(instance.getAttribute('x')).toBe('10');
      expect(instance.getAttribute('y')).toBe('25');
      expect(instance.style.left).toBe('10px');
      expect(instance.style.top).toBe('25px');
    });
  });
});