import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, LayoutDashboard, Target, Kanban, 
  Video, CheckSquare, FileText, FastForward,
  ChevronRight, Sparkles
} from 'lucide-react';
import './WorkflowGuideModal.css';

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    title: 'Your daily starting point.',
    content: 'Check "Today\'s Priorities" each morning for overdue tasks, demos, and stale deals. Use the AI bar at top for quick asks like "show hot leads" or "draft a follow-up."'
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Target,
    path: '/leads',
    title: 'Where new prospects land before becoming deals.',
    content: 'Add manually or bulk-import via CSV. Leads scoring above 70 are marked Hot — contact these first.'
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: Kanban,
    path: '/pipeline',
    title: 'Deal progression & management.',
    content: 'Once a lead\'s interested, it becomes a Deal on the Kanban board. Drag cards across stages as things progress. Click a card to open the Deal Drawer for notes, history, and AI-drafted follow-ups. No activity for 5+ days = flagged Stale, so keep deals moving.'
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: Video,
    path: '/meetings',
    title: 'Hub for calls and demos.',
    content: 'Link meetings to deals when scheduling. After a call, run an AI Summary to capture pain points and next steps.'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    path: '/tasks',
    title: 'Your to-do list for emails, calls, and outreach.',
    content: 'Filter by type or status. Shortcuts: j/k to navigate, Space to mark complete.'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    path: '/documents',
    title: 'Store contracts and proposals here.',
    content: 'Link them to a Company so they show up in the right Deal Drawer. Use AI Summary for long docs.'
  },
  {
    id: 'sequences',
    label: 'Sequences',
    icon: FastForward,
    path: '/sequences',
    title: 'Automated email campaigns for outreach at scale.',
    content: 'Set up steps (Day 1, Day 3, etc.), enroll leads, and it sends on autopilot. Double-check email settings before launching.'
  }
];

export default function WorkflowGuideModal({ onClose, onSkip }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const navigate = useNavigate();

  const activeContent = TABS.find(t => t.id === activeTab);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="wfg-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div 
        className="wfg-modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
      >
        <button className="wfg-close" onClick={onClose}><X size={18} /></button>
        
        <div className="wfg-header">
          <div className="wfg-header-icon"><Sparkles size={24} /></div>
          <div>
            <h2>Daily Workflow Guide</h2>
            <p>Your playbook for closing deals efficiently in Huntlo.</p>
          </div>
        </div>

        <div className="wfg-body">
          <div className="wfg-sidebar">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                className={`wfg-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    className="wfg-tab-indicator"
                    layoutId="wfg-indicator"
                  />
                )}
              </button>
            ))}
          </div>
          
          <div className="wfg-content-area">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="wfg-content-inner"
              >
                <div className="wfg-content-header">
                  <div className="wfg-content-icon-wrap">
                    <activeContent.icon size={28} className="wfg-content-icon" />
                  </div>
                  <h3>{activeContent.label}</h3>
                </div>
                <h4>{activeContent.title}</h4>
                <p>{activeContent.content}</p>

                <div className="wfg-content-actions">
                  <button 
                    className="btn btn-primary btn-md wfg-go-btn"
                    onClick={() => handleNavigate(activeContent.path)}
                  >
                    Go to {activeContent.label} <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="wfg-footer">
          <button className="btn btn-ghost btn-sm" onClick={onSkip}>
            Skip for now
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
