import { GrMLBlock } from './graphical/blocks';
import { GrMLFunction } from './function';
import { GrMLModel } from './model';
import { consoleLabelStyle } from './util';

export class GrMLBootstrapper {
  public static readonly MODELS: { [ TYPE: string ]: any; } = { };
  public static readonly FUNCTIONS: { [ NAME: string ]: any } = { };


  /**
   * Bootstraps the whole application, registering blocks, models and other custom elements.
   * @param elements An ojbject of elements that need to be registered for later use
   */
  public static bootstrap (
    {
      blocks,
      functions,
      models,
      elements,
    }: {
      blocks: any[],
      functions: any[],
      models: (typeof GrMLModel)[];
      elements: [ string, CustomElementConstructor ][],
    }
  ) {
    blocks.forEach((b) => GrMLBootstrapper.registerBlock(b));
    functions.forEach((f) => GrMLBootstrapper.registerFunction(f));
    models.forEach((m) => GrMLBootstrapper.registerModel(m));
    elements.forEach(([ tag, c ]) => customElements.define(tag, c));
  }

  /**
   * Registers blocks with the HTML CustomElementRegistry
   */
  private static registerBlock (block: (typeof GrMLBlock) & CustomElementConstructor) {
    console.warn('%cRegistering', consoleLabelStyle('#009440'), block.TAG_NAME);
    customElements.define(block.TAG_NAME, block);
  }

  /**
   * Registers blocks with the HTML CustomElementRegistry
   */
  private static registerFunction (func: typeof GrMLFunction) {
    console.warn('%cRegistering', consoleLabelStyle('#8f6400'), func.NAME);
    GrMLBootstrapper.FUNCTIONS[func.NAME] = func;
  }

  /**
   * Registers which models can be used in the context of this application.
   */
  private static registerModel (model: typeof GrMLModel) {
    if (model.TYPE) {
      GrMLBootstrapper.MODELS[ model.TYPE ] = model;
    }
  }
}