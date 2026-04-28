import admin from 'firebase-admin';

let initialized = false;
let db: admin.firestore.Firestore | null = null;

export function initFirebase(): void {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.warn('[Firebase] No project ID — running without persistence.');
    return;
  }

  try {
    // On GCP (Cloud Run), Application Default Credentials work automatically.
    // No service account JSON needed.
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    }
    db = admin.firestore();
    initialized = true;
    console.log(`[Firebase] Connected to Firestore (project: ${projectId})`);
  } catch (err) {
    console.warn('[Firebase] Init failed — running without persistence:', (err as Error).message);
  }
}

export function getFirestore(): admin.firestore.Firestore | null {
  if (!initialized) initFirebase();
  return db;
}

// Initialize on import
initFirebase();
