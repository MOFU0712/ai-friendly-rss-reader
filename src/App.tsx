import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArticlesPage } from './pages/index';
import { FeedsPage } from './pages/feeds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ArticlesPage />} />
          <Route path="/feeds" element={<FeedsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
