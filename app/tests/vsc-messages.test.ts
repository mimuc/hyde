import {
  GrMLVSCAppReadyMessage,
  GrMLVSCLogMessage,
  GrMLVSCModelChangedMessage,
  GrMLVSCSendModelMessage,
} from '../../ext/src/messages';
import { GrMLApplication } from '../src/core/app';
import { GrMLAppReadyMessage, GrMLModelChangeEvent } from '../src/core/event';
import { GrMLCompositeNNModel } from '../src/models/composite';
import { GrMLPipelineModel } from '../src/models/pipeline';
import { GrMLVSCHandler } from '../src/vsc/message-handler';

test('GrMLVSCAppReadyMessage can be created', () => {
  expect(new GrMLVSCAppReadyMessage()).toBeDefined();
});

test('GrMLVSCLogMessage can be created', () => {
  expect(new GrMLVSCLogMessage([ ])).toBeDefined();
});

test('GrMLVSCModelChangedMessage can be created', () => {
  expect(new GrMLVSCModelChangedMessage(new GrMLPipelineModel())).toBeDefined();
  expect(new GrMLVSCModelChangedMessage(new GrMLCompositeNNModel())).toBeDefined();
});

test('GrMLVSCSendModelMessage can be created', () => {
  expect(new GrMLVSCSendModelMessage(new GrMLPipelineModel())).toBeDefined();
  expect(new GrMLVSCSendModelMessage(new GrMLCompositeNNModel())).toBeDefined();
});

test('GrMLVSCHandler can be created', () => {
  const app = new GrMLApplication();
  const handler = new GrMLVSCHandler(app);
  expect(handler).toBeDefined;
  expect(handler.handle).toBeDefined;
});

test('GrMLVSCHandler to post messages to VSC', () => {
  const app = new GrMLApplication();
  const handler = new GrMLVSCHandler(app);

  const mockPostMessage = jest.fn();

  Object.defineProperty(GrMLVSCHandler, 'VSC', {
    value: { postMessage: mockPostMessage },
  });

  handler.ready();

  expect(mockPostMessage).toBeCalledTimes(1);
});

test('GrMLVSCHandler to handle VSC Messages', () => {
  const app = new GrMLApplication();
  const handler = new GrMLVSCHandler(app);
  const handlerSpy = jest.spyOn(handler, 'handle');

  handler.handle(new GrMLAppReadyMessage()),
  handler.handle(new GrMLModelChangeEvent());
  handler.handle(new MessageEvent('message', {
    data: {
      model: new GrMLPipelineModel().serialize(),
      command: GrMLVSCSendModelMessage.COMMAND,
    },
  }));
  expect(handlerSpy).toBeCalledTimes(3);
});

test('GrMLVSCHandler ignores unknown message events', () => {
  const app = new GrMLApplication();
  const handler = new GrMLVSCHandler(app);
  const handlerSpy = jest.spyOn(handler, 'handle');

  expect(handler.handle(new MessageEvent('message'))).toBeNull;
  expect(handler.handle(new MessageEvent('message', { data: { command: 'unknown' } }))).toBeNull;
  expect(handler.handle(<MessageEvent> { type: 'message', data: { command: 'unknown' } })).toBeNull;
  expect(handlerSpy).toBeCalledTimes(3);
});