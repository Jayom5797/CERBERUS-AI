import { AuditReport } from '@cerberus/shared';
import { getFirestore } from './firebase';

class ReportStore {
  private cache = new Map<string, AuditReport>();

  async save(report: AuditReport): Promise<void> {
    this.cache.set(report.scanId, report);
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('reports').doc(report.scanId).set(report);
    } catch (err) {
      console.warn('[ReportStore] Firestore write failed:', (err as Error).message);
    }
  }

  async get(scanId: string): Promise<AuditReport | null> {
    if (this.cache.has(scanId)) return this.cache.get(scanId)!;
    const db = getFirestore();
    if (!db) return null;
    try {
      const doc = await db.collection('reports').doc(scanId).get();
      if (!doc.exists) return null;
      const report = doc.data() as AuditReport;
      this.cache.set(scanId, report);
      return report;
    } catch {
      return null;
    }
  }
}

export const reportStore = new ReportStore();
