import { ScanJob, ScanStatus } from '@cerberus/shared';
import { getFirestore } from './firebase';

/**
 * Scan store with Firestore persistence.
 * In-memory cache for fast reads; Firestore as source of truth.
 */
class ScanStore {
  private cache = new Map<string, ScanJob>();

  async save(job: ScanJob): Promise<void> {
    this.cache.set(job.id, { ...job });
    await this.toFirestore(job.id, job);
  }

  async get(id: string): Promise<ScanJob | null> {
    // Check cache first
    if (this.cache.has(id)) return this.cache.get(id)!;
    // Fall back to Firestore
    return this.fromFirestore(id);
  }

  async list(): Promise<ScanJob[]> {
    // Try Firestore first for full list
    const db = getFirestore();
    if (db) {
      try {
        const snap = await db.collection('scans')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        const jobs = snap.docs.map((d) => d.data() as ScanJob);
        // Refresh cache
        jobs.forEach((j) => this.cache.set(j.id, j));
        return jobs;
      } catch {
        // Fall through to cache
      }
    }
    return Array.from(this.cache.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<ScanJob>): Promise<ScanJob | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    const updated: ScanJob = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.cache.set(id, updated);
    await this.toFirestore(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: ScanStatus, error?: string): Promise<void> {
    await this.update(id, { status, ...(error ? { error } : {}) });
  }

  async updateProgress(id: string, progress: number, status?: ScanStatus): Promise<void> {
    await this.update(id, { progress, ...(status ? { status } : {}) });
  }

  private async toFirestore(id: string, data: ScanJob): Promise<void> {
    const db = getFirestore();
    if (!db) return;
    try {
      await db.collection('scans').doc(id).set(data, { merge: true });
    } catch (err) {
      console.warn('[ScanStore] Firestore write failed:', (err as Error).message);
    }
  }

  private async fromFirestore(id: string): Promise<ScanJob | null> {
    const db = getFirestore();
    if (!db) return null;
    try {
      const doc = await db.collection('scans').doc(id).get();
      if (!doc.exists) return null;
      const job = doc.data() as ScanJob;
      this.cache.set(id, job);
      return job;
    } catch {
      return null;
    }
  }
}

export const scanStore = new ScanStore();
