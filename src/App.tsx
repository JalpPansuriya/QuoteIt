import { BrowserRouter, Routes, Route } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/QuotesList';
import { QuoteBuilder } from './pages/QuoteBuilder';
import { Clients } from './pages/Clients';
import { Catalog } from './pages/Catalog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/quotes/new" element={<QuoteBuilder />} />
          <Route path="/quotes/:id" element={<QuoteBuilder />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/settings" element={<div className="p-4">Settings (Coming soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
