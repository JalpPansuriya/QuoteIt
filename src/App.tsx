import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/QuotesList';
import { QuoteBuilder } from './pages/QuoteBuilder';
import { Clients } from './pages/Clients';
import { Catalog } from './pages/Catalog';
import Settings from './pages/Settings';
import PrintQuote from './pages/PrintQuote';
import { Login } from './pages/Login';
import { useStore } from './store/useStore';
import { getSupabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import InventoryForm from './pages/inventory/InventoryForm';
import InventoryDetail from './pages/inventory/InventoryDetail';

// Billing
import InvoiceList from './pages/billing/InvoiceList';
import InvoiceBuilder from './pages/billing/InvoiceBuilder';
import InvoiceDetail from './pages/billing/InvoiceDetail';

// Payments
import PaymentList from './pages/payments/PaymentList';
import PaymentForm from './pages/payments/PaymentForm';
import PaymentDetail from './pages/payments/PaymentDetail';

// Reports
import ReportHub from './pages/reports/ReportHub';
import RevenueReport from './pages/reports/RevenueReport';
import OutstandingReport from './pages/reports/OutstandingReport';
import QuoteConversionReport from './pages/reports/QuoteConversionReport';
import InventoryValueReport from './pages/reports/InventoryValueReport';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, setUser, loadInitialData } = useStore();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!user) {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadInitialData();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, setUser, loadInitialData]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/quotes/new" element={<QuoteBuilder />} />
          <Route path="/quotes/:id" element={<QuoteBuilder />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/settings" element={<Settings />} />

          {/* Inventory */}
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory/new" element={<InventoryForm />} />
          <Route path="/inventory/:id" element={<InventoryDetail />} />

          {/* Billing */}
          <Route path="/billing" element={<InvoiceList />} />
          <Route path="/billing/new" element={<InvoiceBuilder />} />
          <Route path="/billing/:id" element={<InvoiceDetail />} />

          {/* Payments */}
          <Route path="/payments" element={<PaymentList />} />
          <Route path="/payments/new" element={<PaymentForm />} />
          <Route path="/payments/:id" element={<PaymentDetail />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportHub />} />
          <Route path="/reports/revenue" element={<RevenueReport />} />
          <Route path="/reports/outstanding" element={<OutstandingReport />} />
          <Route path="/reports/quotes" element={<QuoteConversionReport />} />
          <Route path="/reports/inventory" element={<InventoryValueReport />} />
        </Route>

        <Route path="/print/:id" element={<PrintQuote />} />
      </Routes>
    </BrowserRouter>
  );
}
