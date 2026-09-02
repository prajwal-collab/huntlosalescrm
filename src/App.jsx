// ============================================
// HUNTLO SALES OS — MAIN ROUTER (App.jsx)
// ============================================
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { isConfigured } from './lib/supabase';
import useAuthStore from './store/useAuthStore';
import useUIStore from './store/useUIStore';
import SetupRequired from './components/setup/SetupRequired';
import { DialogProvider } from './context/DialogContext';
import { supabase } from './lib/supabase';

// Layout & Auth
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvite from './pages/auth/AcceptInvite';

// Pages
import HomeOS from './pages/HomeOS';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Sequences from './pages/Sequences';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Team from './pages/Team';
import CallLogs from './pages/CallLogs';
import AdminDashboard from './pages/AdminDashboard';
import FieldOps from './pages/FieldOps';
import InvoiceGenerator from './pages/InvoiceGenerator';

import Calculator from './pages/Calculator';
import ProposalViewer from './pages/ProposalViewer';
import Webinars from './pages/Webinars';
import WebinarDetail from './pages/WebinarDetail';
import UTMGenerator from './pages/UTMGenerator';
import LinkRedirect from './pages/LinkRedirect';

// Global listener to catch password recovery hashes from emails
function AuthListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });
    return () => subscription?.unsubscribe();
  }, [navigate]);
  return null;
}

export default function App() {
  const { initialize } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    if (isConfigured) {
      initialize();
    }
  }, [initialize]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  // Show setup screen if Supabase is not configured
  if (!isConfigured) return <SetupRequired />;

  return (
    <DialogProvider>
      <BrowserRouter>
        <AuthListener />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/l/:code" element={<LinkRedirect />} />

          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeOS />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/sequences" element={<Sequences />} />
              <Route path="/field-ops" element={<FieldOps />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/invoice-generator" element={<InvoiceGenerator />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/team" element={<Team />} />
              <Route path="/call-logs" element={<CallLogs />} />
              <Route path="/webinars" element={<Webinars />} />
              <Route path="/webinars/:id" element={<WebinarDetail />} />
              <Route path="/utm" element={<UTMGenerator />} />
            </Route>
            <Route path="/proposal/preview" element={<ProposalViewer />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}
