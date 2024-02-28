import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as fsd from 'fs';
import * as path from 'path';

export class GrMLExtensionOutput {

  private output = vscode.window.createOutputChannel('GrML Output');
  private file = (() => {
    const now = new Date();
    const foldername = 'grml-logging';
    const filename = `${now.getDate()}-${now.getMonth()}-${now.getHours()}-${now.getMinutes()}.txt`;
    const filepath = path.join(foldername, filename);
    let file: fs.FileHandle | null = null;
    try {
      if (!fsd.existsSync(foldername)) {
        fsd.mkdirSync(foldername);
        console.info(`Created folder ${foldername} for logging in ${filepath}.`);
      }
    } catch (err) {
      console.error(`Logging not available. Could not create folder ${foldername} for logging ${path.resolve(filepath)} \n`,
        err);
    }
    fs.open(filepath, 'a').then((handle) => {
      file = handle;
      console.info(`Logging in ${path.resolve(filepath)}.`);
    });
    return {
      write: (str: string) => file?.writeFile(str),
    };
  })();

  public log (msg: string) {
    this.output.appendLine(msg);
    this.output.show();
  }

  public error (msg: string) {
    this.output.appendLine(msg);
    this.output.show(true);
    vscode.window.showErrorMessage(msg);
  }

  public persist (message: string, ...info : string[]) {
    this.file.write(`${+new Date()}\t${message}\t${info}\n`);
  }
}