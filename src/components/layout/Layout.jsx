// ============================================
// HUNTLO SALES OS — MAIN LAYOUT
// ============================================
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandCenter from '../ai/CommandCenter';
import useUIStore from '../../store/useUIStore';
import useDataStore from '../../store/useDataStore';
import useAuthStore from '../../store/useAuthStore';
import { useKeyboard } from '../../hooks/useKeyboard';
import NewDealDrawer from '../pipeline/NewDealDrawer';
import NotificationManager from './NotificationManager';
import './Layout.css';

export default function Layout({ children }) {
  const { commandCenterOpen, toggleCommandCenter, closeCommandCenter } = useUIStore();
  const { fetchData } = useDataStore();
  const { fetchTeam } = useAuthStore();
  const [newDealOpen, setNewDealOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTeam();
  }, [fetchData, fetchTeam]);

  useKeyboard({
    'ctrl+k': () => toggleCommandCenter(),
    'cmd+k': () => toggleCommandCenter(),
    'escape': () => closeCommandCenter(),
  });

  return (
    <div className="app-shell">
      <NotificationManager />
      <Sidebar />
      <div className="main-area">
        <TopBar onNewDeal={() => setNewDealOpen(true)} />
        <main className="page-content">
          {children}
        </main>
      </div>
      {commandCenterOpen && (
        <CommandCenter onClose={closeCommandCenter} />
      )}
      {newDealOpen && (
        <NewDealDrawer onClose={() => setNewDealOpen(false)} />
      )}
    </div>
  );
}
