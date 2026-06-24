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
import WorkflowGuideModal from './WorkflowGuideModal';
import './Layout.css';

export default function Layout({ children }) {
  const { commandCenterOpen, toggleCommandCenter, closeCommandCenter, openNewLead } = useUIStore();
  const { fetchData } = useDataStore();
  const { fetchTeam } = useAuthStore();
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTeam();
  }, [fetchData, fetchTeam]);

  useEffect(() => {
    const lastSeenStr = localStorage.getItem('huntlo_workflow_guide_last_seen');
    if (!lastSeenStr) {
      setShowGuide(true);
    } else {
      const lastSeen = new Date(lastSeenStr);
      const diffTime = Math.abs(new Date() - lastSeen);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays >= 2) {
        setShowGuide(true);
      }
    }
  }, []);

  const handleCloseGuide = () => {
    localStorage.setItem('huntlo_workflow_guide_last_seen', new Date().toISOString());
    setShowGuide(false);
  };

  useKeyboard({
    'ctrl+k': () => toggleCommandCenter(),
    'cmd+k': () => toggleCommandCenter(),
    'escape': () => closeCommandCenter(),
    'c': () => openNewLead(),
    '/': (e) => {
      // Focus the first search input on the page if available
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
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
      {showGuide && (
        <WorkflowGuideModal 
          onClose={handleCloseGuide} 
          onSkip={handleCloseGuide} 
        />
      )}
    </div>
  );
}
