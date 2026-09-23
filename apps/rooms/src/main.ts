import { Server, Room } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';

class ReefFoundationRoom extends Room {
  maxClients = 4;
  onAuth(): never { throw new Error('AUTH_SERVICE_NOT_READY'); }
}
// No open unauthenticated fish tables and no credit settlement in this scaffolding.
const server = new Server({ transport: new WebSocketTransport() });
server.define('reef-party', ReefFoundationRoom);
await server.listen(2567, '127.0.0.1');
console.log('Fish room service scaffold: local port 2567; joins disabled until trusted sessions are implemented.');
