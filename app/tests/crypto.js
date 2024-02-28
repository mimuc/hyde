const nodeCrypto = require('crypto');

Object.defineProperty(global, 'crypto', {
  value: ({
    randomUUID: nodeCrypto.randomUUID,
  }),
});

Object.defineProperty(global, 'acquireVsCodeApi', {
  value: () => ({ getState: () => null, setState: () => null, postMessage: () => null  }),
});
