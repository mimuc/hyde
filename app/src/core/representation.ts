import { GrMLElement } from './element';
import { GrMLFunction } from './function';
import { GrMLBlock } from './graphical/blocks';
import { GrMLBlockSerialization, GrMLCodeSerialization } from './serializable.interface';
import { GrMLCodeSnippet } from './textual/code-snippet';


export enum REPRESENTATION_TYPES {
  CODE = 'CODE',
  BLOCK = 'BLOCK',
}

export interface GrMLRepresentation extends GrMLElement {
  REPRESENTATION_TYPE: REPRESENTATION_TYPES; // which representation type is the object
  parent: GrMLFunction; // to handle interactions with nodes in the frontend

  serialize(): GrMLBlockSerialization | GrMLCodeSerialization;
}

export type VariousRepresentations = Record<string, unknown>;
export type WithBlockRepresentation = { [REPRESENTATION_TYPES.BLOCK]: GrMLBlock };
export type WithCodeRepresentation = { [REPRESENTATION_TYPES.CODE]: GrMLCodeSnippet };

export interface HasRepresentation {
  representations: VariousRepresentations;
}

export interface HasBlockRepresentation extends HasRepresentation {
  representations: VariousRepresentations & WithBlockRepresentation;
}

export interface HasCodeRepresentation extends HasRepresentation {
  representations: VariousRepresentations & WithCodeRepresentation;
}
