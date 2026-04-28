import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="scan/:id" element={<ScanPage />} />
        <Route path="report/:id" element={<ReportPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
    </Routes>
  );
}
