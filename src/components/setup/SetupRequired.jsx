// ============================================
// HUNTLO SALES OS — SETUP REQUIRED SCREEN
// ============================================
import { useState } from 'react';
import { ExternalLink, Copy, Check, Key, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const DETECTED_URL = import.meta.env.VITE_SUPABASE_URL;
const urlDetected = DETECTED_URL && DETECTED_URL.includes('.supabase.co');

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: copied ? 'var(--success)' : 'var(--text-tertiary)',
      display: 'flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 500, transition: 'color 0.2s',
      padding: '2px 6px', borderRadius: '4px',
    }}>
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

export default function SetupRequired() {
  const envText = urlDetected
    ? `VITE_SUPABASE_URL=${DETECTED_URL}\nVITE_SUPABASE_ANON_KEY=<paste your anon key here>\nVITE_APP_URL=http://localhost:3000`
    : `VITE_SUPABASE_URL=https://your-project-ref.supabase.co\nVITE_SUPABASE_ANON_KEY=<paste your anon key here>\nVITE_APP_URL=http://localhost:3000`;

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'fixed', inset: 0, overflowY: 'auto',
    }}>
      <div style={{
        position: 'fixed', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        top: '-100px', left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
            <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Huntlo<span style={{ color: 'var(--accent-blue)' }}> OS</span>
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Almost there — one key missing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
            Your Supabase project URL is detected. You just need to add your <strong style={{ color: 'var(--text-primary)' }}>anon key</strong>.
          </p>
        </div>

        {/* URL Status */}
        <div style={{
          background: urlDetected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${urlDetected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {urlDetected
            ? <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0 }} />
            : <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0 }} />}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: urlDetected ? 'var(--success)' : 'var(--danger)', marginBottom: '2px' }}>
              {urlDetected ? 'Project URL detected' : 'Project URL missing'}
            </p>
            {urlDetected && (
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                {DETECTED_URL}
              </p>
            )}
          </div>
        </div>

        {/* Step: Get anon key */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: '12px', padding: '18px 20px', marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--accent-blue-muted)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0,
            }}>
              <Key size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Copy your anon key from Supabase
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                Go to your Supabase project → <strong>Settings → API</strong> → copy the <code style={{ color: 'var(--accent-blue)', fontSize: '11px', background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: '3px' }}>anon</code> <code style={{ color: 'var(--accent-blue)', fontSize: '11px', background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: '3px' }}>public</code> key.
              </p>
              <a
                href={urlDetected ? `https://supabase.com/dashboard/project/${DETECTED_URL?.split('//')[1]?.split('.')[0]}/settings/api` : 'https://supabase.com/dashboard'}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)', textDecoration: 'none' }}
              >
                Open API Settings → <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Step: Update .env */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: '12px', padding: '18px 20px', marginBottom: '16px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Update your <code style={{ color: 'var(--accent-blue)', fontSize: '12px' }}>.env</code> file
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Paste the anon key into your <code style={{ fontSize: '11px' }}>.env</code> file in the project root, then restart the dev server.
          </p>
          <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--bg-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--bg-border)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em' }}>.env</span>
              <CopyButton text={envText} />
            </div>
            <pre style={{ margin: 0, padding: '12px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto' }}>
              {envText}
            </pre>
          </div>
        </div>

        {/* Restart hint */}
        <div style={{
          background: 'var(--accent-blue-muted)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <ArrowRight size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            After saving <code style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>.env</code>, stop and restart with{' '}
            <code style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>npm run dev</code> — the login page will appear immediately.
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>Login:</strong> prajwal@earlyjobs.in with your Supabase password.
          </p>
        </div>
      </div>
    </div>
  );
}
