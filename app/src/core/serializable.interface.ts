import { UUID } from './element';
import { VariousRepresentations } from './representation';

export interface Serializable {
  serialize (): any;
}

interface GrMLPortSerialization {
  name: string;
  uuid: UUID;
  portName?: string
}

// interface GrMLFunctionIOSerialization {
//   name: string;
//   uuid: UUID;
//   portName?: string
// }

export interface GrMLFunctionSerialization {
  name: string;
  originalName: string;
  uuid: UUID;
  properties: { [key: string]: any };
  parameters: GrMLPortSerialization[];
  returnValues: GrMLPortSerialization[];
  representation: VariousRepresentations;
  sources: { data: {
    startFunc: UUID | null,
    startFuncReturnIndex: number | null,
  }[] }[];
  parentFunctionId?: UUID;
  code: string;
  // protected: boolean;
}

export interface GrMLModelFunctionSerialization extends GrMLFunctionSerialization {
  model: GrMLModelSerialization;
}

export interface GrMLCodeSerialization {
  type: string; // TAG_NAME
  content: string[];
}

export interface GrMLBlockSerialization {
  type: string;
  name: string;
  protected: boolean;
  locked: boolean;
  inputs: GrMLPortSerialization[];
  outputs: GrMLPortSerialization[];
  position: {
    x: string | null,
    y: string | null,
  };
}

export interface GrMLModelBlockSerialization extends GrMLBlockSerialization {
  model: GrMLModelSerialization;
}

export interface GrMLModelSerialization {
  name: string;
  type: string;
  children: GrMLFunctionSerialization[];
  parentId?: UUID; // id of the parent function holding the model
}

export interface GrMLConnectionSerialisation {
  returnValueId: UUID | undefined,
  paramId: UUID | undefined,
  paramFuncId: UUID | undefined,
  returnValueFuncId: UUID | undefined,
}