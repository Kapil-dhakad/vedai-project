import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

export interface WSEvent {
  type: 'status' | 'error' | 'connected' | 'subscribed';
  assignmentId?: string;
  status?: string;
  paperId?: string;
  message?: string;
  progress?: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private subscriptions = new Map<string, Set<WebSocket>>();
  private clientMap = new WeakMap<WebSocket, string>();

  init(wss: WebSocketServer): void {
    this.wss = wss;
    console.log('✅ WebSocket server initialized');

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log(`🔌 WebSocket client connected from ${req.socket.remoteAddress}`);

      this.send(ws, { type: 'connected', message: 'Connected to VedaAI server' });

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch {
          this.send(ws, { type: 'error', message: 'Invalid message format' });
        }
      });

      ws.on('close', () => {
        this.cleanup(ws);
        console.log('🔌 WebSocket client disconnected');
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err.message);
        this.cleanup(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, msg: { type: string; assignmentId?: string }): void {
    if (msg.type === 'subscribe' && msg.assignmentId) {
      this.subscribe(ws, msg.assignmentId);
      this.send(ws, {
        type: 'subscribed',
        assignmentId: msg.assignmentId,
        message: `Subscribed to assignment ${msg.assignmentId}`,
      });
    } else if (msg.type === 'ping') {
      this.send(ws, { type: 'connected', message: 'pong' });
    }
  }

  private subscribe(ws: WebSocket, assignmentId: string): void {
    const oldId = this.clientMap.get(ws);
    if (oldId) {
      this.subscriptions.get(oldId)?.delete(ws);
    }

    if (!this.subscriptions.has(assignmentId)) {
      this.subscriptions.set(assignmentId, new Set());
    }
    this.subscriptions.get(assignmentId)!.add(ws);
    this.clientMap.set(ws, assignmentId);
  }

  private cleanup(ws: WebSocket): void {
    const assignmentId = this.clientMap.get(ws);
    if (assignmentId) {
      this.subscriptions.get(assignmentId)?.delete(ws);
      if (this.subscriptions.get(assignmentId)?.size === 0) {
        this.subscriptions.delete(assignmentId);
      }
    }
  }

  broadcast(assignmentId: string, event: WSEvent): void {
    const clients = this.subscriptions.get(assignmentId);
    if (!clients || clients.size === 0) {
      console.log(`📡 No subscribers for assignment ${assignmentId}`);
      return;
    }

    const payload = JSON.stringify({ ...event, assignmentId });
    let sent = 0;
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        sent++;
      }
    });
    console.log(`📡 Broadcast to ${sent}/${clients.size} clients for assignment ${assignmentId}`);
  }

  private send(ws: WebSocket, event: WSEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  getSubscriberCount(assignmentId: string): number {
    return this.subscriptions.get(assignmentId)?.size || 0;
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
