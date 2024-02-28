import { GrMLFunction } from '../../core/function';

export abstract class GrMLActionLayerFunction extends GrMLFunction {

  constructor (tagname: string) {
    super(tagname, 1, 1);
  }
}