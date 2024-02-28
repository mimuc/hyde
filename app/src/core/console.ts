import { GrMLLogLevel } from '../../../ext/src/messages';
import { GrMLLogEvent } from './event';

export class GrMLConsole {
  public static log (...msgs: any[]): void {
    window.dispatchEvent(new GrMLLogEvent(msgs));
  }

  public static error (...msgs: any[]): void {
    window.dispatchEvent(new GrMLLogEvent(msgs, GrMLLogLevel.ERROR));
  }
}
