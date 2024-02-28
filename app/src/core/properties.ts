import { GrMLElement } from './element';
import { template, stylesheet } from './util';

export enum GrMLPropertyType {
  BOOLEAN,
  STRING,
  CODE,
  NUMBER,
  URL,
  JSON,
  FILE,
  RANGE,
  SELECT,
}

export type GrMLProperties = {
  [key: string]: {
    type: GrMLPropertyType,
    label: string,
    value?: any,
    args?: any,
    description?: string,
    validators?: ((v: any) => false | string)[],
    onChange?: (value: any) => void,
  }
};

export interface GrMLHasProperties {
  name: string;
  properties: GrMLProperties;
}

export class GrMLPropertyEditor extends GrMLElement {
  public static TAG_NAME = 'grml-property-editor';

  private properties: GrMLProperties | null = null;

  constructor () {
    super([
      stylesheet`css/grml-properties.css`,
      template`<h3>Properties</h3><ul id="propertyList"></ul>`
    ]);
  }

  public get props (): GrMLProperties | null {
    return this.properties;
  }

  public set props (p: GrMLProperties | null) {
    this.properties = p;
    this.update();
  }

  public update () {
    const wrapper = this.shadowRoot?.getElementById('propertyList');
    if (!wrapper) {
      return;
    }

    wrapper.innerHTML = '';

    if (this.properties && typeof this.properties === 'object') {
      for (const key in this.properties) {
        const property = this.properties[key];
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.innerText = property.label;
        li.appendChild(label);
        switch (property.type) {
          case GrMLPropertyType.STRING:
            {
              const input = document.createElement('input');
              input.addEventListener('blur', () => {
                const errors = property.validators?.map((f) => f(input.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = input.value;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              input.type = 'text';
              input.value = property.value || '';
              li.append(input);
            }
            break;
          case GrMLPropertyType.CODE:
            {
              const textarea = document.createElement('textarea');
              textarea.classList.add('code');
              textarea.addEventListener('blur', () => {
                const errors = property.validators?.map((f) => f(textarea.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = textarea.value;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              textarea.value = property.value || '';
              li.append(textarea);
            }
            break;
          case GrMLPropertyType.NUMBER:
            {
              const input = document.createElement('input');
              input.addEventListener('blur', () => {
                const errors = property.validators?.map((f) => f(input.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = parseInt(input.value);
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              input.type = 'number';
              input.value = property.value || '';
              li.append(input);
            }
            break;
          case GrMLPropertyType.RANGE:
            {
              const input = document.createElement('input');
              const label = document.createElement('label');
              label.innerText = property.value || '';
              input.addEventListener('input', () => {
                const errors = property.validators?.map((f) => f(input.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = input.value;
                label.innerText = input.value;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              if (property.args) {
                if (property.args.min) {
                  input.min = property.args.min;
                }
                if (property.args.max) {
                  input.max = property.args.max;
                }
                if (property.args.step) {
                  input.step = property.args.step;
                }
              }
              input.type = 'range';
              input.value = property.value || '';
              li.append(input);
              li.append(label);
            }
            break;
          case GrMLPropertyType.URL:
            {
              const input = document.createElement('input');
              if (property.value) {
                input.value = property.value;
              }
              input.addEventListener('blur', () => {
                const errors = property.validators?.map((f) => f(input.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = input.value;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              input.type = 'text';
              input.value = property.value || '';
              li.appendChild(input);
            }
            break;
          case GrMLPropertyType.JSON:
            {
              const textarea = document.createElement('textarea');
              textarea.classList.add('code');
              if (property.value) {
                textarea.value = property.value;
              }
              textarea.addEventListener('blur', () => {
                const errors = property.validators?.map((f) => f(textarea.value))
                  .filter((err) => Boolean(err));
                if (errors?.length) {
                  li.classList.add('has-error');
                } else {
                  li.classList.remove('has-error');
                }
                property.value = textarea.value;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              li.appendChild(textarea);
            }
            break;
          case GrMLPropertyType.BOOLEAN:
            {
              const label = document.createElement('label');
              const input = <HTMLInputElement> document.createElement('input');
              input.type = 'checkbox';
              input.checked = property.value;
              input.addEventListener('change', () => {
                // TODO: Validators
                property.value = input.checked;
                if (property.onChange) {
                  property.onChange(property.value);
                }
              });
              if (property.description) {
                label.appendChild(document.createTextNode(property.description));
              }
              label.appendChild(input);
              li.appendChild(label);
            }
            break;
          case GrMLPropertyType.FILE:
            {
              {
                const input = document.createElement('input');
                input.type = 'file';
                const fileInfo = document.createElement('div');
                li.appendChild(fileInfo);
                li.append(input);
                if (property.value && property.value instanceof File) {
                  fileInfo.innerHTML = property.value.name;
                }
                const btn = document.createElement('button');
                btn.innerText = 'Upload';
                li.appendChild(btn);

                btn.addEventListener('click', () => {
                  const errors = property.validators?.map((f) => f(input.value))
                    .filter((err) => Boolean(err));
                  if (errors?.length) {
                    li.classList.add('has-error');
                  } else {
                    li.classList.remove('has-error');
                  }
                  if (input.files?.length) {
                    property.value = input.files.item(0);
                    if (property.value && property.value instanceof File) {
                      fileInfo.innerHTML = property.value.name;
                    }
                  } else {
                    property.value = null;
                  }
                  if (property.onChange) {
                    property.onChange(property.value);
                  }
                });

              }
            }
            break;
          case GrMLPropertyType.SELECT:
            {
              const select = document.createElement('select');
              if (property.args && property.args['options']) {
                property.args['options'].forEach((opt: string) => {
                  const option = document.createElement('option');
                  option.value = opt;
                  option.innerText = opt;
                  select.appendChild(option);
                });
                select.addEventListener('change', () => {
                  // TODO: Validators
                  property.value = select.value;
                  if (property.onChange) {
                    property.onChange(property.value);
                  }
                });

                select.value = property.value || 'None';
                li.appendChild(select);
              }
            }
            break;
        }

        wrapper.appendChild(li);
      }
    }
  }
}