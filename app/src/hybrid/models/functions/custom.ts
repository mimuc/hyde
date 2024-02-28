import { CUSTOM_FUNC_NOT_SUPPORTET } from '../../../core/error-reporting';
import { GrMLFunction } from '../../../core/function';
import { GrMLBlock } from '../../../core/graphical/blocks';
import { GrMLModel } from '../../../core/model';
import { GrMLProperties } from '../../../core/properties';
import { HasBlockRepresentation, HasCodeRepresentation, REPRESENTATION_TYPES, VariousRepresentations, WithBlockRepresentation, WithCodeRepresentation } from '../../../core/representation';
import { GrMLCodeSnippet } from '../../../core/textual/code-snippet';

/**
 * A custom function
 *
 */
export class GrMLCustomFunction extends GrMLFunction implements HasCodeRepresentation, HasBlockRepresentation {
  public static readonly Block = class C extends GrMLBlock {
    public static TAG_NAME = 'grml-custom';
    constructor (public parent: GrMLCustomFunction){
      super(parent); 
      this.setAttribute('x', '20'); 
      this.setAttribute('y', '20'); 
    }
  };

  public static readonly CodeSnippet = class C extends GrMLCodeSnippet {
    constructor (public parent: GrMLFunction) {
      super(parent, 'custom', (paramNames, retNames, properties) => [
        'def '
      ]);
      // allow general code editing
      if (this.codefield) { this.codefield.contentEditable = 'true'; }
    }
  };

  public static NAME = 'Custom';
  public static VERBOSE_NAME = 'Custom';

  public representations: VariousRepresentations & WithCodeRepresentation & WithBlockRepresentation = {
    [REPRESENTATION_TYPES.CODE]: new GrMLCustomFunction.CodeSnippet(this),
    [REPRESENTATION_TYPES.BLOCK]: new GrMLCustomFunction.Block(this),
   };

  public properties: GrMLProperties = {};


  constructor (public parent: GrMLModel) {
    super(GrMLCustomFunction.VERBOSE_NAME, 0, 0);
    this.addWarning(CUSTOM_FUNC_NOT_SUPPORTET);
  }

  public data (): Promise<any[]> {
    throw new Error('Custom functions are currently not supported.');
  }

}