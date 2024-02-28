import { stylesheet } from './util';

declare const crypto: any;

export type UUID = string;

export interface HasUUID {
  uuid: UUID;
}

export interface HasParent<P> {
  parent: P | null;
}

export interface HasPath<T> {
  path: T[];
}

export interface Updateable {
  update (): void;
}

export abstract class GrMLElement extends HTMLElement implements HasUUID, Updateable {
  public static TAG_NAME = 'grml-element';

  private _uuid = crypto.randomUUID();

  constructor (elems: Node[] = [ ]) {
    super();
    this.attachShadow({ mode: 'open' });


    this.shadowRoot?.append(
      stylesheet`css/global-style.css`,
      stylesheet`css/theme.css`,
      ...elems
    );
  }

  public get id () {
    return this._uuid;
  }

  public set id (id: string) {
    this._uuid = id;
    this.setAttribute('id', this._uuid);
  }

  public get uuid (): string {
    return this._uuid;
  }

  public set uuid (uuid: string) {
    this._uuid = uuid;
    this.id = uuid;
  }

  public abstract update(): void;
}
