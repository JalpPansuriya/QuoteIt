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
import { NotificationCenter } from './pages/NotificationCenter';
import { ClientDetails } from './pages/ClientDetails';
import ProjectList from './pages/projects/ProjectList';
import ProjectForm from './pages/projects/ProjectForm';
import ProjectDetail from './pages/projects/ProjectDetail';
import { useStore, useHydration } from './store/useStore';
import { getSupabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Production
import { ProductionTracker } from './pages/ProductionTracker';

// Billing
import InvoiceList from './pages/billing/InvoiceList';
import InvoiceBuilder from './pages/billing/InvoiceBuilder';
import InvoiceDetail from './pages/billing/InvoiceDetail';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import InventoryForm from './pages/inventory/InventoryForm';
import InventoryDetail from './pages/inventory/InventoryDetail';

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
import ProjectProfitabilityReport from './pages/reports/ProjectProfitabilityReport';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'admin' | 'site_person' }) {
  const { user, role, setUser, loadInitialData } = useStore();
  const hydrated = useHydration();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    const supabase = getSupabase();
    
    // Check session on mount/refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Always trigger a fresh fetch on app load/refresh
        loadInitialData();
      }
      setLoading(false);
    });
  }, [hydrated, setUser, loadInitialData]);

  if (!hydrated || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/" replace />;
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
          <Route path="/clients" element={<ProtectedRoute requiredRole="admin"><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute requiredRole="admin"><ClientDetails /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute requiredRole="admin"><Catalog /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<NotificationCenter />} />

          {/* Projects */}
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProtectedRoute requiredRole="admin"><ProjectForm /></ProtectedRoute>} />
          <Route path="/projects/edit/:id" element={<ProtectedRoute requiredRole="admin"><ProjectForm /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Inventory */}
          <Route path="/inventory" element={<ProtectedRoute requiredRole="admin"><InventoryList /></ProtectedRoute>} />
          <Route path="/inventory/new" element={<ProtectedRoute requiredRole="admin"><InventoryForm /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute requiredRole="admin"><InventoryDetail /></ProtectedRoute>} />

          {/* Production */}
          <Route path="/production" element={<ProtectedRoute requiredRole="admin"><ProductionTracker /></ProtectedRoute>} />

          {/* Billing */}
          <Route path="/billing" element={<ProtectedRoute requiredRole="admin"><InvoiceList /></ProtectedRoute>} />
          <Route path="/billing/new" element={<ProtectedRoute requiredRole="admin"><InvoiceBuilder /></ProtectedRoute>} />
          <Route path="/billing/:id" element={<ProtectedRoute requiredRole="admin"><InvoiceDetail /></ProtectedRoute>} />

          {/* Payments */}
          <Route path="/payments" element={<ProtectedRoute requiredRole="admin"><PaymentList /></ProtectedRoute>} />
          <Route path="/payments/new" element={<ProtectedRoute requiredRole="admin"><PaymentForm /></ProtectedRoute>} />
          <Route path="/payments/:id" element={<ProtectedRoute requiredRole="admin"><PaymentDetail /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><ReportHub /></ProtectedRoute>} />
          <Route path="/reports/revenue" element={<ProtectedRoute requiredRole="admin"><RevenueReport /></ProtectedRoute>} />
          <Route path="/reports/outstanding" element={<ProtectedRoute requiredRole="admin"><OutstandingReport /></ProtectedRoute>} />
          <Route path="/reports/quotes" element={<ProtectedRoute requiredRole="admin"><QuoteConversionReport /></ProtectedRoute>} />
          <Route path="/reports/inventory" element={<ProtectedRoute requiredRole="admin"><InventoryValueReport /></ProtectedRoute>} />
          <Route path="/reports/profitability" element={<ProtectedRoute requiredRole="admin"><ProjectProfitabilityReport /></ProtectedRoute>} />
        </Route>

        <Route path="/print/:id" element={<PrintQuote />} />
      </Routes>
    </BrowserRouter>
  );
}
