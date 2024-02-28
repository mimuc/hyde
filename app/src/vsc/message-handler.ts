import { GrMLApplication } from '../core/app';
import {
  GrMLAppReadyMessage,
  GrMLExecuteCodeEvent,
  GrMLLogEvent,
  GrMLRequestDatasetMessaage,
} from '../core/event';
import {
  GrMLVSCAppReadyMessage,
  GrMLVSCSendModelMessage,
  GrMLVSCLogMessage,
  GrMLVSCModelChangedMessage,
  GrMLVSCDataSetRequestMessage,
  GrMLVSCDataSeResponsetMessage,
  GrMLVSCPersistentLogMessage,
  GrMLVSCExecuteCodeRequestMessage,
  GrMLVSCKernelIdleMessage
} from '../../../ext/src/messages';
import { GrMLDataSet } from '../../../ext/src/datasets/datasets';

import { GrMLMessageHandler } from '../core/message-handler';
import { GrMLPipelineModel } from '../models/pipeline';
import { GrMLModel } from '../core/model';
import { GrMLConsole } from '../core/console';
import { GrMLFunction } from '../core/function';

export declare type VSC = { getState: () => any, setState: (_: any) => void, postMessage: (_: any) => void  };
declare const acquireVsCodeApi: () => VSC;

export class GrMLVSCHandler implements GrMLMessageHandler {
  private static VSC = (() => { try { return acquireVsCodeApi(); } catch (err) { return undefined; } })();

  private static postMessage (msg: any) {
    if (GrMLVSCHandler.VSC) {
      GrMLVSCHandler.VSC?.postMessage(msg);
    } else {
      console.warn('Could not send message to VSC.', msg);
    }
  }

  // TODO: Flo should they be static as well?
  private codeQueue: {uuid: string | undefined, codeSnippet: string, retValCode: string, codeEditTimeWhenAdded: Date, func: GrMLFunction | undefined}[] = [];
  private currExecutedGrmlFunction: {uuid: string | undefined, codeSnippet: string, retValCode: string, codeEditTimeWhenAdded: Date, func: GrMLFunction} | undefined;
  private kernelIdle = true;

  constructor (private app: GrMLApplication) { }

  public logPersistent (message: any) {
    GrMLVSCHandler.postMessage(new GrMLVSCPersistentLogMessage(message));
  }

  public handle (message: MessageEvent<any>): any {
    if (!message || !message.data || !message.data.command) {
      return null;
    }
    this.logPersistent(message.data.command);
    switch (message.data.command) {
      case GrMLRequestDatasetMessaage.COMMAND:
        return this.requestDataset((<GrMLRequestDatasetMessaage> message).dataset);
      case GrMLVSCDataSeResponsetMessage.COMMAND:
        return console.info(message);
      // case GrMLRepresentationChangeEvent.COMMAND: return this.updateModel(this.app.model);
      // case GrMLModelLoad - do nothing, otherwise: infinite loop
      case GrMLLogEvent.COMMAND: return this.log(<GrMLLogEvent> message);
      case GrMLAppReadyMessage.COMMAND: return this.ready();
      case GrMLVSCSendModelMessage.COMMAND: {
        const model = (<GrMLVSCSendModelMessage> message.data).model;
        if (model) {
          this.app.onNewModel(GrMLModel.deserialize(model));
        }
        return;
      }
      case GrMLExecuteCodeEvent.COMMAND: {
        const uuid = (<GrMLExecuteCodeEvent> message).uuid;
        const func = (<GrMLExecuteCodeEvent> message).grmlFunction;
        const codeSnippet = (<GrMLExecuteCodeEvent> message).codeSnippet;
        const retValCode = (<GrMLExecuteCodeEvent> message).retValCode;
        const codeEditTimestampWhenAdded = (<GrMLExecuteCodeEvent> message).codeEditTimestampWhenAdded;
        return this.requestCodeExecution(uuid, func, codeSnippet, retValCode, codeEditTimestampWhenAdded);
      }
      case GrMLVSCKernelIdleMessage.COMMAND: return this.onKernelIdleMessage((<GrMLVSCKernelIdleMessage> message.data).status);
      default: return null;
    }
  }

  public ready () {
    GrMLVSCHandler.postMessage({ command: GrMLVSCAppReadyMessage.COMMAND });
  }

  public log (event: GrMLLogEvent) {
    GrMLVSCHandler.postMessage(new GrMLVSCLogMessage(event.messages, event.level));
  }

  public updateModel (model: GrMLPipelineModel | null) {
    if (model) {
      GrMLVSCHandler.postMessage(new GrMLVSCModelChangedMessage(model.serialize()));
    }
  }

  public requestDataset (dataset: GrMLDataSet) {
    GrMLVSCHandler.postMessage(new GrMLVSCDataSetRequestMessage(dataset));
  }

  public requestCodeExecution (uuid: string | undefined, grmlFunc: GrMLFunction | undefined, codeSnippet: string, retValCode: string, codeEditTimestampWhenAdded: Date) {
    this.codeQueue.push({ uuid: uuid, codeSnippet: codeSnippet, retValCode: retValCode, codeEditTimeWhenAdded: codeEditTimestampWhenAdded, func: grmlFunc });

    if (this.kernelIdle) {
      this.executeNextCode();
    }
  }

  private onKernelIdleMessage (status: string) {
    if (status === 'ok') {
      if (this.currExecutedGrmlFunction) {
        this.currExecutedGrmlFunction.func.codeEditTimestampWhenComputed = this.currExecutedGrmlFunction.codeEditTimeWhenAdded;
      }
    } else {
      const uuidToRemove = this.currExecutedGrmlFunction?.uuid;
      if (this.currExecutedGrmlFunction?.uuid) {
        this.codeQueue = this.codeQueue.filter(codeObj => codeObj.uuid !== uuidToRemove);
      }
    }

    this.executeNextCode();
  }

  private executeNextCode () {
    this.kernelIdle = false;

    // case code queue is empty
    const nextCodeObj = this.codeQueue.shift();
    if (!nextCodeObj) {
      this.kernelIdle = true;
      this.currExecutedGrmlFunction = undefined;
      return;
    }

    // if next code is not a GrMLFunction but code to rename a variable instead, just execute the code
    const grmlFunc = nextCodeObj.func;
    if (!grmlFunc) {
      const nextCode = nextCodeObj.codeSnippet;
      GrMLVSCHandler.postMessage(new GrMLVSCExecuteCodeRequestMessage(nextCode));
      return;
    }

    const recentUuid = this.currExecutedGrmlFunction?.uuid;
    const recentCodeObjTimestampExecuted = this.currExecutedGrmlFunction?.func.codeEditTimestampWhenComputed;
    const calculateNew = recentUuid === nextCodeObj.uuid && recentCodeObjTimestampExecuted ? recentCodeObjTimestampExecuted > nextCodeObj.codeEditTimeWhenAdded : false;

    this.currExecutedGrmlFunction = { uuid: nextCodeObj.uuid, codeSnippet: nextCodeObj.codeSnippet, retValCode: nextCodeObj.retValCode, codeEditTimeWhenAdded: nextCodeObj.codeEditTimeWhenAdded, func: nextCodeObj.func as GrMLFunction };

    if (calculateNew || this.currExecutedGrmlFunction.codeEditTimeWhenAdded > this.currExecutedGrmlFunction.func.codeEditTimestampWhenComputed) {
      const nextCode = this.currExecutedGrmlFunction.codeSnippet;
      GrMLVSCHandler.postMessage(new GrMLVSCExecuteCodeRequestMessage(nextCode));
    } else {
      const nextCode = this.currExecutedGrmlFunction.retValCode;
      GrMLVSCHandler.postMessage(new GrMLVSCExecuteCodeRequestMessage(nextCode));
    }
  }
}
