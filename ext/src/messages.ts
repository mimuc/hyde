import { GrMLDataSet } from "./datasets/datasets";

export abstract class VSCMessage {
  constructor (public command: string) { }
}


export class GrMLVSCAppReadyMessage extends VSCMessage {
  public static COMMAND = 'grml-vsc-app-ready';
  constructor () {
    super(GrMLVSCAppReadyMessage.COMMAND);
  }
}

export class GrMLVSCSendModelMessage extends VSCMessage {
  public static COMMAND = 'grml-vsc-send-model';
  constructor (public model: any) {
    super(GrMLVSCSendModelMessage.COMMAND);
  }
}


export class GrMLVSCModelChangedMessage extends VSCMessage {
  public static COMMAND = 'grml-vsc-model-changed';
  constructor (public model: any) {
    super(GrMLVSCModelChangedMessage.COMMAND);
  }
}

export enum GrMLLogLevel {
  LOG,
  ERROR,
}

export class GrMLVSCLogMessage extends VSCMessage {
  public static COMMAND = 'grml-vsc-log-message';
  constructor (public messages: string[], public level: GrMLLogLevel = GrMLLogLevel.LOG) {
    super(GrMLVSCLogMessage.COMMAND);
  }
}

export class GrMLVSCDataSetRequestMessage extends VSCMessage {
  public static COMMAND = 'dataset-request';
  constructor (public type: GrMLDataSet) {
    super(GrMLVSCDataSetRequestMessage.COMMAND);
  }
}

export class GrMLVSCDataSeResponsetMessage extends VSCMessage {
  public static COMMAND = 'dataset-response';
  constructor (public type: GrMLDataSet, public dataset: any) {
    super(GrMLVSCDataSeResponsetMessage.COMMAND);
  }
}

export class GrMLVSCDataSePartialResponsetMessage extends VSCMessage {
  public static COMMAND = 'dataset-response-part';
  constructor (public type: GrMLDataSet, public dataset: any, public offset: number) {
    super(GrMLVSCDataSePartialResponsetMessage.COMMAND);
  }
}

export class GrMLVSCPersistentLogMessage extends VSCMessage {
  public static COMMAND = 'log-persistent';
  constructor (public message: string) {
    super(GrMLVSCPersistentLogMessage.COMMAND);
  }
}

export class GrMLVSCExecuteCodeRequestMessage extends VSCMessage {
  public static COMMAND = 'kernel-execute-code-request';
  constructor (public code: string) {
    super(GrMLVSCExecuteCodeRequestMessage.COMMAND);
  }
}

export class GrMLVSCKernelIdleMessage extends VSCMessage {
  public static COMMAND = 'kernel-idle';
  constructor (public status: string) {
    super(GrMLVSCKernelIdleMessage.COMMAND);
  }
}
