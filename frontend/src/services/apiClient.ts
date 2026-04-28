import axios from 'axios';
import { ScanRequest, ScanJob, AuditReport } from '@cerberus/shared';

// In production, VITE_API_URL points to the backend Cloud Run URL.
// In dev, Vite proxy handles /api → localhost:4000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for consistent error handling
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'Request failed';
    throw new Error(message);
  }
);

export const apiClient = {
  async startScan(request: ScanRequest): Promise<{ scanId: string; status: string }> {
    const res = await http.post<{ success: boolean; data: { scanId: string; status: string } }>('/scans', request);
    return res.data.data;
  },

  async getScan(id: string): Promise<ScanJob> {
    const res = await http.get<{ success: boolean; data: ScanJob }>(`/scans/${id}`);
    return res.data.data;
  },

  async listScans(): Promise<ScanJob[]> {
    const res = await http.get<{ success: boolean; data: ScanJob[] }>('/scans');
    return res.data.data;
  },

  async getReport(scanId: string): Promise<AuditReport> {
    const res = await http.get<{ success: boolean; data: AuditReport }>(`/reports/${scanId}`);
    return res.data.data;
  },
};
