// ============================================
// HUNTLO SALES OS — MAIN ROUTER (App.jsx)
// ============================================
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isConfigured } from './lib/supabase';
import useAuthStore from './store/useAuthStore';
import useUIStore from './store/useUIStore';
import SetupRequired from './components/setup/SetupRequired';
import { DialogProvider } from './context/DialogContext';

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
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

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
            <Route element={<Layout><Settings /></Layout>} path="/settings" />
            <Route element={<Layout><Team /></Layout>} path="/team" />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}
