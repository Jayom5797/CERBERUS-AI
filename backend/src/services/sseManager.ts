import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ScanEvent } from '@cerberus/shared';

/**
 * Manages Server-Sent Events connections per scan.
 */
class SSEManager {
  // scanId → Map<clientId, Response>
  private clients = new Map<string, Map<string, Response>>();

  addClient(scanId: string, res: Response): string {
    const clientId = uuidv4();
    if (!this.clients.has(scanId)) {
      this.clients.set(scanId, new Map());
    }
    this.clients.get(scanId)!.set(clientId, res);
    console.log(`[SSE] Client ${clientId} connected to scan ${scanId}`);
    return clientId;
  }

  removeClient(scanId: string, clientId: string): void {
    this.clients.get(scanId)?.delete(clientId);
    console.log(`[SSE] Client ${clientId} disconnected from scan ${scanId}`);
  }

  emit(scanId: string, event: ScanEvent): void {
    const scanClients = this.clients.get(scanId);
    if (!scanClients || scanClients.size === 0) return;

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    const deadClients: string[] = [];

    scanClients.forEach((res, clientId) => {
      try {
        res.write(payload);
      } catch {
        deadClients.push(clientId);
      }
    });

    deadClients.forEach((id) => scanClients.delete(id));
  }

  broadcast(event: ScanEvent): void {
    this.emit(event.scanId, event);
  }
}

export const sseManager = new SSEManager();
