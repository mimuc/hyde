import { GrMLFunction } from '../../core/function';
import { GrMLType } from '../../core/types';


export abstract class GrMLCompositeLayerFunction extends GrMLFunction {
    // TODO: Flo adapt to executing code in python. Maybe this class is obsolete now, since the previous `abstract layer` is now inside each derived class' CodeSnippet
    public static TAG_NAME = 'grml-composite-layer';
    public static DISPLAY_NAME = 'Layer';

    constructor (tag?: string) {
      super(tag ?? 'grml-composite-layer', 1, 1);
      this.parameters[0].type = new GrMLType.Union(new GrMLType.Dataset(), new GrMLType.Tensor());
      this.returnValues[0].type = new GrMLType.Union(new GrMLType.Dataset(), new GrMLType.Tensor());
    }
}

