import { useState, useMemo } from 'react';
import {
  Search, Plus, Play, Pause, GitMerge, Mail, Clock, X,
  Trash2, BarChart2, Activity, Users, Zap, Sparkles, FileText, RefreshCw
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import { generateFullSequence } from '../lib/gemini';
import SequenceEditor from '../components/sequences/SequenceEditor';
import { useDialog } from '../context/DialogContext';
import './Sequences.css';

const TEMPLATE_DATA = {
  "Blank Sequence": [],
  "FLOW 1 — FEEDBACK → DEMO → DESIGN PARTNER": [
    { id: '1', type: 'email', day: 0, subject: 'Quick feedback on your recruiting workflow?', content: 'Hey {{first_name}},\n\nI was researching {{company_name}} and noticed you\'re scaling your recruiting team. Would love to get your honest take on how you currently manage outbound sourcing.\n\nTakes 2 minutes — worth it?' },
    { id: '2', type: 'reply', day: 3, subject: '', content: 'Bumping this up — your perspective would genuinely help us build something useful for teams like {{company_name}}.' },
    { id: '3', type: 'email', day: 7, subject: 'Demo invite for {{first_name}}', content: 'Hey {{first_name}},\n\nBased on what I\'ve seen from similar {{industry}} companies, I think Huntlo could cut your sourcing time by 40%+.\n\nWorth 15 minutes to see it live?' },
  ],
  "FLOW 2 — RECRUITER WORKFLOW AUDIT": [
    { id: '1', type: 'email', day: 0, subject: 'How does {{company_name}} manage recruiter outreach?', content: 'Hi {{first_name}},\n\nWe\'re seeing a big shift in how {{industry}} companies are handling recruiter outreach — curious how {{company_name}} is approaching it today?' },
    { id: '2', type: 'reply', day: 3, subject: '', content: 'Sharing a free Recruiter Workflow Audit template we built — teams using it are cutting sourcing time by 30%. Want me to send it over?' },
    { id: '3', type: 'email', day: 8, subject: 'Last note — free audit template', content: 'Hey {{first_name}}, sending the audit template regardless — it\'s genuinely useful even if we never talk. Reply and I\'ll send it over.' },
  ],
  "FLOW 3 — THE CONTRARIAN CAMPAIGN": [
    { id: '1', type: 'email', day: 0, subject: 'Unpopular opinion on SDR outreach', content: 'Hi {{first_name}},\n\nHot take: Most SDR personalization is theatre. The data shows response rates are identical.\n\nThe real differentiator? Timing + context signals. We built Huntlo around that insight.' },
    { id: '2', type: 'reply', day: 4, subject: '', content: 'Curious if that resonated — or if you think I\'m completely wrong (both make for a good conversation).' },
  ],
  "FLOW 4 — THE DESIGN PARTNER PROGRAM": [
    { id: '1', type: 'email', day: 0, subject: 'Exclusive: Design Partner invite for {{company_name}}', content: 'Hey {{first_name}},\n\nWe\'re inviting 5 forward-thinking {{industry}} companies to co-build the next version of Huntlo as Design Partners — early access, input on roadmap, and founder-level pricing.\n\n{{company_name}} fits the profile exactly. Interested?' },
    { id: '2', type: 'reply', day: 3, subject: '', content: 'Keeping this slot open for a few more days — would love for {{company_name}} to be part of this.' },
  ],
  "FLOW 5 — THE MARKET INSIGHT SERIES": [
    { id: '1', type: 'email', day: 0, subject: 'Market Insight: How top {{industry}} companies are winning outbound', content: 'Hi {{first_name}},\n\nWe analysed 500+ {{industry}} companies on outbound performance. One pattern emerged: the top 10% are using intent signals, not spray-and-pray.\n\nThought {{company_name}} would find this useful.' },
    { id: '2', type: 'reply', day: 5, subject: '', content: 'Following up — the full report is ready. Want me to send it over?' },
  ],
  "FLOW 6 — VALUE-DRIVEN PRODUCT DISCOVERY": [
    { id: '1', type: 'email', day: 0, subject: 'Quick question about {{company_name}}', content: 'Hi {{first_name}},\n\n[Lead with keywords that tell them what this is about].\n\nI noticed [Drop a recent move on their side, only if there is a real one].\n\nReaching out because [Make it clear why reaching out makes sense].\n\nLet me know if this topic fits, no pressure either way.\n\nBest,\n[Your Name]' },
    { id: '2', type: 'reply', day: 3, subject: '', content: 'Hi {{first_name}},\n\nDid you get time to read my first email?\n\nCould any of this be useful on your side?\n\nLet me know if it ever becomes a need.\n\nThanks,\n[Your Name]' },
    { id: '3', type: 'reply', day: 7, subject: '', content: 'Hi {{first_name}},\n\nTo add a bit more context, [Go deeper on what sets your setup apart from the rest].\n\nOften, staying with the current setup means [Name what they risk by staying with what they have].\n\nFor example, [Give one concrete detail that makes the difference real].\n\nBest,\n[Your Name]' },
    { id: '4', type: 'reply', day: 14, subject: '', content: 'Hi {{first_name}},\n\nI understand the timing might not be right at the moment.\n\nI\'ll step back without pushing for an answer, but I want to keep the door open if things change on your end.\n\nI\'ll stay available if you ever want to challenge your current provider, even on pricing.\n\nThanks,\n[Your Name]' },
  ],
};

const TEMPLATES = Object.keys(TEMPLATE_DATA);

export default function Sequences() {
  const { sequences, createSequence, deleteSequence } = useDataStore();
  const { showConfirm } = useDialog();
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', channel: 'Email', template: 'Blank Sequence', persona: '', painPoint: '' });
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredSequences = useMemo(() => {
    if (!search) return sequences;
    return sequences.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
  }, [sequences, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name && formData.template !== 'Generate with AI') {
      setError('Please enter a sequence name.');
      return;
    }
    setError(null);
    try {
      let nodesToUse = [];
      let sequenceName = formData.name || formData.template;

      if (formData.template === 'Generate with AI') {
        setIsGenerating(true);
        try {
          const rawResponse = await generateFullSequence(
            formData.persona || 'B2B Buyers',
            formData.painPoint || 'Increasing sales velocity',
            sequenceName
          );
          const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiData = JSON.parse(jsonStr);
          if (aiData.planName) sequenceName = aiData.planName;
          if (aiData.touchpoints && Array.isArray(aiData.touchpoints)) {
            nodesToUse = aiData.touchpoints.map((tp, idx) => ({
              id: Date.now().toString() + idx,
              type: 'email',
              day: tp.waitDays > 0 ? tp.waitDays : idx * 3,
              time: '09:00',
              subject: tp.subject || '',
              content: tp.body || ''
            }));
          }
        } catch (parseErr) {
          console.error('Failed to parse AI response:', parseErr);
          throw new Error('AI generated an invalid format. Please try again.');
        } finally {
          setIsGenerating(false);
        }
      } else {
        nodesToUse = (TEMPLATE_DATA[formData.template] || []).map(n => ({ ...n, id: Date.now().toString() + Math.random() }));
      }

      const newSeq = await createSequence({
        name: sequenceName,
        channel: formData.channel,
        status: 'inactive',
        steps: nodesToUse.length,
        enrolled: 0,
        reply_rate: 0,
        nodes: nodesToUse
      });
      setIsAdding(false);
      setSelected(newSeq);
      setFormData({ name: '', channel: 'Email', template: 'Blank Sequence', persona: '', painPoint: '' });
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setError(err.message || 'Failed to create sequence.');
    }
  };

  if (selected) {
    return <SequenceEditor sequence={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="sequences-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Sequences</h1>
          <p className="page-big-sub">Multi-channel outbound automation workflows</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Create Sequence</button>
      </div>

      <div className="sequences-layout">
        {/* Sidebar */}
        <div className="sequences-sidebar">
          <div className="search-box" style={{ marginBottom: 12 }}>
            <Search size={14} />
            <input
              placeholder="Search sequences..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <X size={12} style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={() => setSearch('')} />}
          </div>

          <div className="seq-list">
            {filteredSequences.map(seq => (
              <div
                key={seq.id}
                className={`seq-list-item ${selected?.id === seq.id ? 'selected' : ''}`}
                onClick={() => setSelected(seq)}
                style={{ position: 'relative' }}
              >
                <div className="seq-list-top" style={{ paddingRight: 28 }}>
                  <span className="seq-list-name truncate" style={{ maxWidth: 180, fontWeight: 600 }}>{seq.name}</span>
                  {seq.status === 'active' || seq.status === 'Active'
                    ? <Play size={11} color="var(--success)" />
                    : <Pause size={11} color="var(--text-tertiary)" />}
                </div>
                <div className="seq-list-meta">
                  <span>{seq.steps || 0} steps</span>
                  <span>·</span>
                  <span>{seq.enrolled || 0} enrolled</span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{seq.reply_rate || 0}% reply</span>
                </div>
                <button
                  className="btn-icon"
                  style={{ position: 'absolute', top: 10, right: 6, background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = await showConfirm(
                      'Delete Sequence',
                      `Are you sure you want to permanently delete "${seq.name}"? This cannot be undone.`
                    );
                    if (confirmed) deleteSequence(seq.id);
                  }}
                  title="Delete sequence"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {filteredSequences.length === 0 && (
              <div className="empty-state" style={{ marginTop: 24 }}>
                <GitMerge size={22} />
                <p style={{ fontSize: 13 }}>{search ? 'No sequences match your search.' : 'No sequences yet. Create your first one!'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main area */}
        {!isAdding && (
          <SequenceHubDashboard sequences={sequences} onCreateClick={() => setIsAdding(true)} />
        )}

        {/* Create panel — fixed overlay */}
        {isAdding && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }} onClick={() => !isGenerating && setIsAdding(false)}>
            <div
              className="animate-slide-right"
              style={{ width: 600, maxWidth: '100%', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div style={{ padding: '28px 36px 20px', borderBottom: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Create Workflow</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Configure a new automated outreach campaign.</p>
                  </div>
                  <button
                    style={{ background: 'var(--bg-hover)', border: 'none', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onClick={() => setIsAdding(false)}
                    disabled={isGenerating}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAdd} style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <X size={14} /> {error}
                  </div>
                )}

                {/* Template Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 14 }}>Select Framework</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                    {/* AI Card */}
                    <div
                      onClick={() => setFormData({ ...formData, template: 'Generate with AI', name: '' })}
                      style={{ padding: 18, borderRadius: 12, border: formData.template === 'Generate with AI' ? '2px solid #6366f1' : '1px solid var(--border-color)', background: formData.template === 'Generate with AI' ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Sparkles size={18} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>AI Campaign Generator</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Let Huntlo AI build a hyper-personalized workflow for your persona.</div>
                    </div>

                    {/* Blank Card */}
                    <div
                      onClick={() => setFormData({ ...formData, template: 'Blank Sequence', name: '' })}
                      style={{ padding: 18, borderRadius: 12, border: formData.template === 'Blank Sequence' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', background: formData.template === 'Blank Sequence' ? 'var(--accent-blue-muted)' : 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-hover)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Start from Scratch</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Build your own custom multi-channel workflow step-by-step.</div>
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Or use a proven playbook:</label>
                  <select
                    className="input-base"
                    style={{ background: 'var(--bg-hover)', border: 'none', padding: '11px 14px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', width: '100%', outline: 'none', cursor: 'pointer' }}
                    value={formData.template}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, template: val, name: (val !== 'Blank Sequence' && val !== 'Generate with AI') ? val : formData.name });
                    }}
                  >
                    <option value="" disabled>Select a proven playbook...</option>
                    {TEMPLATES.filter(t => t !== 'Blank Sequence' && t !== 'Generate with AI').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* AI Inputs */}
                {formData.template === 'Generate with AI' ? (
                  <div style={{ padding: 20, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        <Users size={13} color="#6366f1" /> Target Persona *
                      </label>
                      <input
                        className="input-base"
                        autoFocus
                        required
                        value={formData.persona || ''}
                        onChange={e => setFormData({ ...formData, persona: e.target.value })}
                        placeholder="e.g. Head of Talent at Staffing Firms"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        <Activity size={13} color="#6366f1" /> Key Pain Point *
                      </label>
                      <textarea
                        className="input-base"
                        required
                        rows={3}
                        value={formData.painPoint || ''}
                        onChange={e => setFormData({ ...formData, painPoint: e.target.value })}
                        placeholder="e.g. Sourcing candidates manually is too slow and expensive"
                        style={{ resize: 'vertical', minHeight: 72 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Campaign Name *</label>
                      <input
                        className="input-base"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Q3 Staffing Outbound"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 10 }}>Sequence Name *</label>
                    <input
                      className="input-base"
                      autoFocus
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Outbound Q3 — Founders"
                      style={{ padding: '12px 16px', fontSize: 14 }}
                    />
                  </div>
                )}

                {/* Channel */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 10 }}>Primary Channel</label>
                  <div style={{ display: 'flex', gap: 10, background: 'var(--bg-hover)', padding: 4, borderRadius: 10 }}>
                    {['Email', 'LinkedIn', 'Multi-channel'].map(channel => (
                      <div
                        key={channel}
                        onClick={() => setFormData({ ...formData, channel })}
                        style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s', background: formData.channel === channel ? 'var(--bg-surface)' : 'transparent', color: formData.channel === channel ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: formData.channel === channel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
                      >
                        {channel === 'Email' ? 'Email Only' : channel}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 14, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '13px 0', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                    onClick={() => setIsAdding(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: '13px 0', background: formData.template === 'Generate with AI' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--accent-blue)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><RefreshCw size={15} className="spin" /> Generating with AI...</>
                    ) : formData.template === 'Generate with AI' ? (
                      <><Sparkles size={15} /> Generate AI Campaign</>
                    ) : (
                      'Create Workflow'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Global Sequence Hub Dashboard ──────────────────────────
function SequenceHubDashboard({ sequences, onCreateClick }) {
  const activeCount = sequences.filter(s => s.status === 'active' || s.status === 'Active').length;
  const totalEnrolled = sequences.reduce((acc, s) => acc + (s.enrolled || 0), 0);
  const avgReplyRate = sequences.length > 0
    ? (sequences.reduce((acc, s) => acc + (s.reply_rate || 0), 0) / sequences.length).toFixed(1)
    : 0;

  if (sequences.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, background: 'var(--bg-body)' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, background: 'var(--bg-elevated)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
            <Zap size={38} color="var(--accent-blue)" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.4px' }}>Sequence Engine</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
            Your outbound automation control center. Build multi-channel campaigns, leverage AI for personalization, and track real-time performance across your entire pipeline.
          </p>
          <button className="btn btn-primary" onClick={onCreateClick} style={{ padding: '12px 28px', fontSize: 14, borderRadius: 10, gap: 8 }}>
            <Plus size={16} /> Create Your First Workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px', background: 'var(--bg-body)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 28, fontSize: 22, fontWeight: 700 }}>Sequence Hub</h2>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { icon: <Zap size={15} color="var(--accent-blue)" />, label: 'Active Campaigns', value: activeCount, color: 'var(--text-primary)' },
            { icon: <Users size={15} color="var(--text-secondary)" />, label: 'Total Enrolled', value: totalEnrolled, color: 'var(--text-primary)' },
            { icon: <Mail size={15} color="var(--text-secondary)" />, label: 'Sequences Created', value: sequences.length, color: 'var(--text-primary)' },
            { icon: <Activity size={15} color="var(--success)" />, label: 'Avg Reply Rate', value: `${avgReplyRate}%`, color: 'var(--success)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg-elevated)', padding: '20px 22px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {stat.icon}
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Sequence cards grid */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>All Sequences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sequences.map(seq => {
            const isActive = seq.status === 'active' || seq.status === 'Active';
            return (
              <div key={seq.id} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`, cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{seq.name}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: isActive ? 'rgba(34,197,94,0.12)' : 'var(--bg-hover)', color: isActive ? '#16a34a' : 'var(--text-tertiary)', fontWeight: 600, flexShrink: 0 }}>
                    {isActive ? 'Active' : 'Draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <span>{seq.steps || 0} steps</span>
                  <span>{seq.enrolled || 0} enrolled</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{seq.reply_rate || 0}% reply</span>
                </div>
              </div>
            );
          })}
          <div
            onClick={onCreateClick}
            style={{ background: 'transparent', borderRadius: 12, padding: 20, border: '2px dashed var(--border-color)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 100, transition: 'all 0.18s' }}
          >
            <Plus size={20} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>New Sequence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
