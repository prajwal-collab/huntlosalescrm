// ============================================
// HUNTLO SALES OS — AI COMMAND CENTER
// ============================================
import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Loader } from 'lucide-react';
import { queryGemini } from '../../lib/gemini';
import './CommandCenter.css';

const SUGGESTIONS = [
  { icon: '🔥', label: 'Show hot leads', query: 'Show me hot leads' },
  { icon: '⚠️', label: 'Show stale deals', query: 'Show stale deals needing attention' },
  { icon: '📧', label: 'Generate follow-up email', query: 'Generate follow-up email for Notion proposal' },
  { icon: '📊', label: 'Pipeline snapshot', query: 'Give me a pipeline snapshot' },
  { icon: '📅', label: 'Upcoming demos', query: 'Show upcoming demos this week' },
  { icon: '✍️', label: 'Draft outreach for Vercel', query: 'Draft cold outreach for Vercel discovery call' },
];

export default function CommandCenter({ onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleQuery = async (q) => {
    const text = q || query;
    if (!text.trim()) return;
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
    if (e.key === 'ArrowDown') setSelectedIdx(i => Math.min(i + 1, SUGGESTIONS.length - 1));
    if (e.key === 'ArrowUp') setSelectedIdx(i => Math.max(i - 1, 0));
    if (e.key === 'Tab') {
      e.preventDefault();
      setQuery(SUGGESTIONS[selectedIdx].query);
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

        {/* Suggestions */}
        {!response && (
          <div className="cc-suggestions">
            <p className="cc-hint">Suggestions — press Tab to fill, Enter to run</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s.query}
                className={`cc-suggestion ${i === selectedIdx ? 'selected' : ''}`}
                onClick={() => { setQuery(s.query); handleQuery(s.query); }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="cc-sug-icon">{s.icon}</span>
                <span className="cc-sug-label">{s.label}</span>
                <ArrowRight size={12} className="cc-sug-arrow" />
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
