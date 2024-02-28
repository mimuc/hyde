export interface HasWarnings {
  warnings: Warning[];
}

export interface HasErrors {
  errors: string[];
}

export function withWarningNotifier () {
  return (c: any) => {
    const originalUpdate = c.prototype.update;

    c.prototype.update = function () {
      if (this.warnings.length) {
        this.classList.add('has-warnings');
      } else {
        this.classList.remove('has-warnings');
      }
      return originalUpdate.bind(this)();
    };
  };
}

export class Warning {
  constructor (public message: string) { }

  public toString () {
    return this.message;
  }
}

export const NO_DATA_SOURCE_FOR_PORT = new Warning('No data source connected to this port.');
export const NO_DATA_FROM_INPUT = new Warning('Data missing from inputs.');
export const MODEL_INCOMPLETE = new Warning('Model is incomplete.');
export const MODEL_TOO_MANY_PATHS = new Warning('Multiple paths in model. Reduce to one single path.');
export const MODEL_CONTAINS_NON_LAYER_BLOCK = new Warning('Model contains a block that cannot act as a layer.');
export const COULD_NOT_LOAD_IMAGE_DATA = new Warning('Could not load image data.');
export const NO_DATA_FOUND_RESPONSE = new Warning('No data found.');

// Warnings for Code-Snippets
export const CODE_INVALID_RESPONSE = new Warning('Code is invalid.');
export const CODE_NOT_INTERPRETABLE_TO_BLOCK = new Warning('No graphical representation for this cell avialable.');

export const CUSTOM_FUNC_NOT_SUPPORTET = new Warning('Custom functions are not supportet in this version.');
