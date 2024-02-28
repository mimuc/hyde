
import * as fsd from 'fs';
import { spawn, execSync, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as zmq from 'zeromq';
import { createHmac, randomUUID } from 'crypto';
import { GrMLExtensionOutput } from '../grml-logging';
import { Webview } from 'vscode';
import { GrMLVSCKernelIdleMessage } from '../messages';


const KERNEL_TIMEOUT = 10000;

export class IPyKernel {
  output: GrMLExtensionOutput;
  webview: Webview | undefined;
  kernelProcess: ChildProcessWithoutNullStreams;
  key: string | undefined;
  shellPort: number | undefined;
  iopubPort: number | undefined;
  reqSock: zmq.Request;
  iopubSock: zmq.Subscriber;

  constructor(output: GrMLExtensionOutput) {
    this.output = output;

    this.kernelProcess = spawn('ipython', ['kernel']);

    this.reqSock = new zmq.Request();
    this.iopubSock = new zmq.Subscriber();

    const kernelReadyPromise = new Promise((resolve, reject) => {
      const onStdout = (data: Buffer) => {
        // Handle kernel ready event
        cleanupListeneres();
        resolve(data);
      };

      const onStderr = (data: Buffer) => {
        // Handle kernel error event
        cleanupListeneres();
        reject(new Error(data.toString()));
      };

      const onError = (error: Buffer) => {
        // Handle child process error event
        cleanupListeneres();
        reject(error);
      };

      const cleanupListeneres = () => {
        this.kernelProcess.stdout.off('data', onStdout);
        this.kernelProcess.stderr.off('data', onStderr);
        this.kernelProcess.off('error', onError);
      };

      this.kernelProcess.stdout.on('data', onStdout);
      this.kernelProcess.stderr.on('data', onStderr);
      this.kernelProcess.on('error', onError);
    });

    function timeoutPromise(ms: number) {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout of ${ms}ms exceeded`));
        }, ms);
      });
    }

    const kernelReadyDataPromise = Promise.race([kernelReadyPromise, timeoutPromise(KERNEL_TIMEOUT)])
      .then(data => {
        // Handle successful kernel start
        let bufferData = data as Buffer;

        const match = bufferData.toString().match(/kernel-\d+.json/);
        if (match) {
          const connectionFile = match[0];
          try {
            this.parseKernelDataFromFile(connectionFile);
            this.startListeners();
            return Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        } else {
          return Promise.reject('Could not find match for Kernel-Json in ipython response.');
        }
      })
      .catch(error => {
        // Handle error
        console.error(`Error during kernel start. ${error}`);
      });

      kernelReadyDataPromise.then(() => {
        this.connectSockets();
        console.log(`Kernel started with key=${this.key}, shellPort=${this.shellPort}, iopubPort=${this.iopubPort}`);
      });
  }

  private parseKernelDataFromFile (connectionFile: string) {
    try {
      const runtimeDir = execSync('jupyter --runtime-dir').toString().trim();
      connectionFile = path.join(runtimeDir, connectionFile);
    } catch (error) {
      throw new Error(`Error getting jupyter's runtime-dir ${error}`);
    }
    const connectionInfo = JSON.parse(fsd.readFileSync(connectionFile, 'utf-8'));
    this.key = connectionInfo.key;
    this.shellPort = connectionInfo.shell_port;
    this.iopubPort = connectionInfo.iopub_port;
    if (this.key === undefined || this.shellPort === undefined || this.iopubPort === undefined) {
      throw new Error(`At least one of the values 'key', 'shell_port' or 'iopub_port' within ${connectionFile} are undefined`);
    }
    console.log(`Kernel key: ${this.key}     Kernel shellPort: ${this.shellPort}     Kernel iopubPort: ${this.iopubPort}`);
    return;
  }

  private startListeners() {
    // TODO: Fix listeners, currently not working
    this.kernelProcess.stdout.on('data', (data) => {
      console.error(`Kernel process stdout: ${data.toString()}`);
    });

    this.kernelProcess.stderr.on('data', (data) => {
      console.error(`Kernel process error: ${data.toString()}`);
    });

    this.kernelProcess.on('close', (code, signal) => {
      console.log(`Kernel process closed with code ${code} and signal ${signal}`);
    });

    this.kernelProcess.on('disconnect', () => {
      console.log(`Kernel process disconnected`);
    });

    this.kernelProcess.on('error', (err) => {
      console.error(`Failed to start kernel process: ${err}`);
    });

    this.kernelProcess.on('exit', (code) => {
      console.error(`Kernel process exited with code ${code}`);
    });
  }

  private async connectSockets() {
    this.reqSock.connect(`tcp://localhost:${this.shellPort}`);

    this.iopubSock.connect(`tcp://localhost:${this.iopubPort}`);
    this.iopubSock.subscribe('');
    for await (const [zmq_id, delim, hmac, header, parent_header, metadata, content, ...extra] of this.iopubSock) {
      this.output.log(`MSG FROM KERNEL, CONTENT=${content.toString()}`);
    }
  }

  public addWebview(webview: Webview) {
    this.webview = webview;
  }

  public async executeCode(code: string) {
    const msg_id = randomUUID();
    const session = randomUUID();

    const header = {
      'msg_id': msg_id,
      'username': 'username',
      'session': session,
      'msg_type': 'execute_request',
      'version': '5.2'
    };

    const parent = {};

    const metadata = {};

    const content = {
      code: code,
      silent: false,
      store_history: true,
      user_expressions: {},
      allow_stdin: true,
      stop_on_error: true
    };

    if (this.key !== undefined) {

      const encoder = new TextEncoder();

      let sign = JSON.stringify(header)
        + JSON.stringify(parent)
        + JSON.stringify(metadata)
        + JSON.stringify(content);
      let hmac_digest = createHmac("sha256", this.key).update(sign).digest("hex");

      const msg = [
        encoder.encode(''),
        encoder.encode('<IDS|MSG>'),
        hmac_digest,
        new Uint8Array(encoder.encode(JSON.stringify(header))),
        new Uint8Array(encoder.encode(JSON.stringify(parent))),
        new Uint8Array(encoder.encode(JSON.stringify(metadata))),
        new Uint8Array(encoder.encode(JSON.stringify(content))),
      ];

      await this.reqSock.send(msg);

      const [res_zmq_id, res_delim, res_hmac, res_header, res_parent_header, res_metadata, res_content, ...res_extra] = await this.reqSock.receive();

      const status = JSON.parse(res_content.toString())['status'];
      this.webview?.postMessage(new GrMLVSCKernelIdleMessage(status));
    }
  }

  public kill () {
    this.kernelProcess.kill();
    this.key = undefined;
    this.shellPort = undefined;
    this.shellPort = undefined;
  }
}
