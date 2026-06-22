// ============================================
// HUNTLO SALES OS — AI COMMAND CENTER
// ============================================
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Sparkles, ArrowRight, Loader, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { queryGemini } from '../../lib/gemini';
import useUIStore from '../../store/useUIStore';
import './CommandCenter.css';

const SUGGESTIONS = [
  { icon: '🔥', label: 'Show hot leads', query: 'Show me hot leads' },
  { icon: '⚠️', label: 'Show stale deals', query: 'Show stale deals needing attention' },
  { icon: '📧', label: 'Generate follow-up email', query: 'Generate follow-up email for Notion proposal' },
  { icon: '📊', label: 'Pipeline snapshot', query: 'Give me a pipeline snapshot' },
  { icon: '📅', label: 'Upcoming demos', query: 'Show upcoming demos this week' },
  { icon: '✍️', label: 'Draft outreach for Vercel', query: 'Draft cold outreach for Vercel discovery call' },
];

const ACTIONS = [
  { icon: '➕', label: 'Add new lead', action: 'add_lead' },
  { icon: '👥', label: 'Go to Leads', action: 'nav_leads', path: '/' },
  { icon: '🏢', label: 'Go to Accounts', action: 'nav_accounts', path: '/companies' },
  { icon: '📈', label: 'Go to Pipeline', action: 'nav_pipeline', path: '/pipeline' },
  { icon: '⚙️', label: 'Go to Settings', action: 'nav_settings', path: '/settings' },
];

export default function CommandCenter({ onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { openNewLead } = useUIStore();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    const actions = ACTIONS.filter(a => a.label.toLowerCase().includes(q));
    const suggestions = SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q) || s.query.toLowerCase().includes(q));
    return [...actions, ...suggestions];
  }, [query]);

  // Reset selected index when filtered items change
  useEffect(() => { setSelectedIdx(0); }, [filteredItems]);

  const executeItem = async (item) => {
    if (item.action) {
      if (item.path) {
        navigate(item.path);
      } else if (item.action === 'add_lead') {
        openNewLead();
      }
      onClose();
    } else {
      handleQuery(item.query);
    }
  };

  const handleQuery = async (q) => {
    const text = q || query;
    if (!text.trim()) return;
    
    // If they press enter on an exact match from filtered items, execute that
    const selectedItem = filteredItems[selectedIdx];
    if (selectedItem && !q && !response) {
      executeItem(selectedItem);
      return;
    }

    setLoading(true);
    setResponse('');
    try {
      const result = await queryGemini(text);
      setResponse(result);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { handleQuery(); return; }
    if (e.key === 'ArrowDown') setSelectedIdx(i => Math.min(i + 1, filteredItems.length - 1));
    if (e.key === 'ArrowUp') setSelectedIdx(i => Math.max(i - 1, 0));
    if (e.key === 'Tab') {
      e.preventDefault();
      const item = filteredItems[selectedIdx];
      if (item) setQuery(item.query || item.label);
    }
  };

  return (
    <div className="cc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cc-modal animate-slide-up">
        {/* Header */}
        <div className="cc-header">
          <Sparkles size={15} className="cc-ai-icon" />
          <input
            ref={inputRef}
            className="cc-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setResponse(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything — 'Show hot leads', 'Generate follow-up', 'Pipeline snapshot'..."
          />
          {loading && <Loader size={15} className="cc-spinner" />}
          {!loading && query && (
            <button className="cc-send" onClick={() => handleQuery()}>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        {/* AI Response */}
        {response && (
          <div className="cc-response">
            <div className="cc-response-label">
              <Sparkles size={11} /> AI Response
            </div>
            <pre className="cc-response-text">{response}</pre>
          </div>
        )}

        {/* Suggestions / Actions */}
        {!response && (
          <div className="cc-suggestions">
            <p className="cc-hint">Commands & AI Actions — press Enter to run</p>
            {filteredItems.length === 0 && (
              <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Press Enter to ask AI: "{query}"
              </div>
            )}
            {filteredItems.map((s, i) => (
              <button
                key={s.query || s.label}
                className={`cc-suggestion ${i === selectedIdx ? 'selected' : ''}`}
                onClick={() => executeItem(s)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="cc-sug-icon">{s.icon}</span>
                <span className="cc-sug-label">{s.label}</span>
                {s.action ? (
                  <Terminal size={12} className="cc-sug-arrow" style={{ opacity: 0.5 }} />
                ) : (
                  <Sparkles size={12} className="cc-sug-arrow" style={{ opacity: 0.5 }} />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="cc-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>Tab</kbd> fill</span>
          <span><kbd>Enter</kbd> run</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
