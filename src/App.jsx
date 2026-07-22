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

  // Show setup screen if Supabase is not configured
  if (!isConfigured) return <SetupRequired />;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

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
            <Route element={<Layout><HomeOS /></Layout>} path="/" />
            <Route element={<Layout><Leads /></Layout>} path="/leads" />
            <Route element={<Layout><Pipeline /></Layout>} path="/pipeline" />
            <Route element={<Layout><Companies /></Layout>} path="/companies" />
            <Route element={<Layout><Contacts /></Layout>} path="/contacts" />
            <Route element={<Layout><Tasks /></Layout>} path="/tasks" />
            <Route element={<Layout><Meetings /></Layout>} path="/meetings" />
            <Route element={<Layout><Sequences /></Layout>} path="/sequences" />
            <Route element={<Layout><Documents /></Layout>} path="/documents" />
            <Route element={<Layout><Reports /></Layout>} path="/reports" />
            <Route element={<Layout><Calculator /></Layout>} path="/calculator" />
            <Route element={<Layout><Settings /></Layout>} path="/settings" />
            <Route element={<Layout><Team /></Layout>} path="/team" />
            <Route element={<Layout><CallLogs /></Layout>} path="/call-logs" />
            <Route element={<Layout><Webinars /></Layout>} path="/webinars" />
            <Route element={<Layout><WebinarDetail /></Layout>} path="/webinars/:id" />
            <Route element={<Layout><UTMGenerator /></Layout>} path="/utm" />
            <Route element={<ProposalViewer />} path="/proposal/preview" />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}
