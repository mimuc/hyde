import * as vscode from 'vscode';
import * as path from 'path';
import { EDITOR_TYPES } from './editor-types';
import { GrMLWebsocketServer } from './ws/server';
import { promises as fs } from 'fs';
import {
  GrMLLogLevel,
  GrMLVSCAppReadyMessage,
  GrMLVSCLogMessage,
  GrMLVSCModelChangedMessage,
  GrMLVSCDataSetRequestMessage,
  GrMLVSCSendModelMessage,
  GrMLVSCDataSePartialResponsetMessage,
  GrMLVSCPersistentLogMessage,
  GrMLVSCExecuteCodeRequestMessage
} from './messages';
import { GrMLExtensionOutput } from './grml-logging';
import { isNumberedHeader } from 'parse5/dist/common/html';
import { loadPetDataset } from './datasets/pets';
import { GrMLDataSet } from './datasets/datasets';
import { IPyKernel } from './jupyter-kernel/ipykernel';

let kernel: IPyKernel;
let output: GrMLExtensionOutput; // 'GrML Output'

function GrMLEditorProvider (type: EDITOR_TYPES) {
  return class C implements vscode.CustomTextEditorProvider {

    public static register (context: vscode.ExtensionContext): vscode.Disposable {
      const provider = new C(context);
      const providerRegistration = vscode.window.registerCustomEditorProvider(C.viewType, provider);
      return providerRegistration;
    }

    public static readonly viewType = type.toString();

    constructor(private readonly context: vscode.ExtensionContext) { }

    public resolveCustomTextEditor (
      _: vscode.TextDocument,
      panel: vscode.WebviewPanel,
    ): void | Thenable<void> {
      panel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'dist')),
        ],
      };

      const baseUrl = panel.webview.asWebviewUri(vscode.Uri.file(
        path.join(this.context.extensionPath, 'dist', 'app/')
      ));

      panel.webview.html = template(type, baseUrl);

      kernel.addWebview(panel.webview);

      panel.webview.onDidReceiveMessage((message) => {
        if (message.command === GrMLVSCLogMessage.COMMAND) {
          // log message in output 'GrML Output'
          message.messages.forEach((m: string) => {
            if ((<GrMLVSCLogMessage>message).level === GrMLLogLevel.ERROR) {
              output.error(m);
            } else {
              output.log(m);
            }
          });
        } else {
          // log selected events in file
          const eventsToLog = ['grml-block-select', 'grml-remove', 'grml-add-function', 'grml-portname-change', 'grml-port-connected', 'grml-open-submodel'];
          if(eventsToLog.includes(message.message)){
            output.persist(message.message);
          }
        }

      switch (message.command) {

        case GrMLVSCPersistentLogMessage.COMMAND: {
          output.persist((<GrMLVSCPersistentLogMessage> message).message);
          break;
        }

        case GrMLVSCExecuteCodeRequestMessage.COMMAND:{
          kernel.executeCode((<GrMLVSCExecuteCodeRequestMessage> message).code);
          break;
        }
      }
    });

		// const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
    //   console.info('FILE CHANGED');
		// 	if (e.document.uri.toString() === document.uri.toString()) {
    //     panel.webview.postMessage(
    //       new GrMLVSCSendModelMessage(JSON.parse(document.getText()))
    //     );
		// 	}
		// });

		panel.onDidDispose(() => {
			// changeDocumentSubscription.dispose();
		});
  }
};

}



export function activate (context: vscode.ExtensionContext) {
  context.subscriptions.push(GrMLEditorProvider(EDITOR_TYPES.TEXT).register(context));
  context.subscriptions.push(GrMLEditorProvider(EDITOR_TYPES.BLOCK).register(context));
  console.log('Activated grml extensions');

  const websocketServer = new GrMLWebsocketServer();
  console.info('Websocket Server started.', websocketServer);
  output = new GrMLExtensionOutput(); // 'GrML Output'
  kernel = new IPyKernel(output);
  console.info('IPython Kernel started.', kernel);
}


export function deactivate() {

  kernel.kill();
  console.log('Kernel killed');

}


const template = (type: EDITOR_TYPES, baseUrl: vscode.Uri) => `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>GrML</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseUrl}">
  <link rel="stylesheet" href="css/global-style.css">
  <link rel="stylesheet" href="css/theme.css">
  <link rel="stylesheet" href="css/grml-text-app.css">
  <script src="main.js"></script>
  <script src="vendor.js"></script>
</head>
<body>
<!-- <grml-app type=${type.toString()}></grml-app> -->
${type.toString() === EDITOR_TYPES.BLOCK ?
    '<grml-app></grml-app>' :
    '<grml-text-app></grml-text-app>'}
</body>
</html>
`;