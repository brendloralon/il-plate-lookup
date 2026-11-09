import { Route, Routes } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { ReportPage } from './pages/ReportPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/vehicle/:plate" element={<ReportPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
