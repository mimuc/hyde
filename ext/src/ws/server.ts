import { WebSocketServer, WebSocket } from 'ws';

export class GrMLWebsocketServer {
  private wss: WebSocketServer;

  constructor (port: number = parseInt(process.env.PORT || '7000')) {
    this.wss = new WebSocketServer({ port: port });
    console.info('New Websocket Server on port', port);

    this.wss.on('connection', (ws) => {
      console.info('Client connected');

      ws.on('message', (data, isBinary) => {
        console.info('Server received data');

        this.wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data, { binary: isBinary });
          }
        });
      });
    });
  }
}
