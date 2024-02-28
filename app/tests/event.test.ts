import { GrMLLogLevel } from '../../ext/src/messages';
import {
  GrMLAppReadyMessage,
  GrMLBlockConnectedEvent,
  GrMLBlockSelectEvent,
  GrMLBootstrapEvent,
  GrMLLibraryItemDragStartEvent,
  GrMLLogEvent,
  GrMLMessage,
  GrMLModelChangeEvent,
  GrMLSubModelSelectedEvent,
} from '../src/core/event';
import { GrMLGroupBlock } from '../src/operations/group';


describe('GrMLEvents', () => {
  describe('Event creation', () => {
    test('Events can be created', () => {
      const messages: GrMLMessage[] = [
        new GrMLAppReadyMessage(),
        new GrMLBlockSelectEvent(new GrMLGroupBlock()),
        new GrMLLibraryItemDragStartEvent(GrMLGroupBlock.TAG_NAME),
        new GrMLBootstrapEvent(),
        new GrMLModelChangeEvent(),
        new GrMLBlockConnectedEvent(new GrMLGroupBlock()),
        new GrMLLogEvent([ 'Hello', 'World' ]),
        new GrMLLogEvent([ 'Hello', 'World' ], GrMLLogLevel.ERROR),
        new GrMLSubModelSelectedEvent([ ]),
      ];

      for (const msg of messages) {
        expect(msg).toBeDefined;
        expect(msg.data).toBeDefined;
        expect(msg.data.command).toBeDefined;
      }
    });
  });
});