export interface HasType {
  type: GrMLDataType;
}

export interface HasIOTypes {
  type: [ GrMLDataType[], GrMLDataType[] ];
}

export interface IsExecutable {
  executable: boolean;
  execute (): Promise<any>;
}

export interface GrMLDataType {
  type: string;
  toString (): string;
}

const GrMLTypeNone: GrMLDataType = {
  type: 'NONE',
  toString () { return 'Unknown type'; },
};

const GrMLTypeString: GrMLDataType = {
  type: 'STRING',
  toString () { return 'String'; }
};

const GrMLTypeNumber: GrMLDataType = {
  type: 'NUMBER',
  toString () { return 'Number'; }
};

const GrMLTypeScalar: GrMLDataType = {
  type: 'SCALAR',
  toString () { return 'Scalar'; }
};

class GrMLTypeTensor implements GrMLDataType {
  public static readonly TYPE = 'TENSOR';
  public readonly type = GrMLTypeTensor.TYPE;
  constructor (public readonly shape: (number | '*')[] = [ ]) { }
  public toString () {
    if (this.shape.length < 1) {
      return 'Tensor';
    } else {
      return `Tensor [ ${ this.shape } ]`;
    }
  }
}

class GrMLTypeModel implements GrMLDataType {
  public static readonly TYPE = 'MODEL';
  public readonly type = GrMLTypeModel.TYPE;
  constructor (
    public readonly state: 'Uninitialized' | 'Initalized' | 'Trained' = 'Uninitialized',
    public readonly inputShape: number[] = [ ]
  ) { }
  public toString () {
    return 'Model';
  }
}

class GrMLTypeArray implements GrMLDataType {
  public static readonly TYPE = 'ARRAY';
  public readonly type = GrMLTypeArray.TYPE;
  constructor (public of: GrMLDataType) { }
  public toString (): string {
    return `List of ${this.of.toString()}`;
  }
}

class GrMLTypeTuple implements GrMLDataType {
  public static readonly TYPE = 'TUPLE';
  public readonly type = GrMLTypeTuple.TYPE;
  public of: GrMLDataType[];
  public labels: string[] = [ ];
  constructor (...types: GrMLDataType[] | [ any ]) {
    if (types[0] && typeof types[0] === 'object' && types[0].constructor.name === 'Object') {
      this.labels = Object.keys(types[0]);
      this.of = Object.values(types[0]);
    } else {
      this.of = types;
    }
  }
  public toString (): string {
    return `(\n${this.of.map((t, i) => '  ' + (this.labels[i] ? this.labels[i] + ': ' : '') + t.toString()).join('\n')}\n)`;
  }
}

class GrMLTypeBatches implements GrMLDataType {
  public static readonly TYPE = 'BATCHES';
  public readonly type = GrMLTypeBatches.TYPE;
  constructor (public of: GrMLDataType) { }
  public toString (): string {
    return `Batches of ${this.of.toString()}`;
  }
}

class GrMLTypeDataset implements GrMLDataType {
  public static readonly TYPE = 'DATASET';
  public readonly type = GrMLTypeDataset.TYPE;
  constructor (public of?: GrMLDataType) { }
  public toString (): string {
    if (this.of) {
      return `Dataset of ${this.of.toString()}`;
    } else {
      return 'Dataset';
    }
  }
}

class GrMLTypeUnion implements GrMLDataType {
  public static readonly TYPE = 'UNION';
  public readonly type = GrMLTypeUnion.TYPE;
  public of: GrMLDataType[];
  constructor (...of: GrMLDataType[]) {
    this.of = of;
  }
  public toString (): string {
    return this.of.map((t) => t.toString()).join(' | ');
  }
}

export const GrMLType = {
  Array: GrMLTypeArray,
  Model: GrMLTypeModel,
  String: GrMLTypeString,
  Number: GrMLTypeNumber,
  None: GrMLTypeNone,
  Scalar: GrMLTypeScalar,
  Tensor: GrMLTypeTensor,
  Batched: GrMLTypeBatches,
  Tuple: GrMLTypeTuple,
  Dataset: GrMLTypeDataset,
  Union: GrMLTypeUnion,
};
