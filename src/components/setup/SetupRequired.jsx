// ============================================
// HUNTLO SALES OS — SETUP REQUIRED SCREEN
// ============================================
import { useState } from 'react';
import { ExternalLink, Copy, Check, Terminal, Database, Key, ArrowRight, CheckCircle } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const steps = [
  {
    num: '01',
    title: 'Create a free Supabase project',
    desc: 'Go to supabase.com, sign up free, and create a new project.',
    link: 'https://supabase.com/dashboard/new/_',
    linkLabel: 'Open Supabase Dashboard →',
    icon: Database,
  },
  {
    num: '02',
    title: 'Copy your project URL & anon key',
    desc: 'In your project: Settings → API → copy Project URL and anon/public key.',
    icon: Key,
  },
  {
    num: '03',
    title: 'Create a .env file in your project root',
    desc: 'Paste the values below into a new .env file, then restart the dev server.',
    icon: Terminal,
    code: true,
  },
  {
    num: '04',
    title: 'Create your user account',
    desc: 'In Supabase: Authentication → Users → Add user → enter prajwal@earlyjobs.in and your password.',
    icon: CheckCircle,
  },
];

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

const envTemplate = `VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`;

export default function SetupRequired() {
  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'fixed', inset: 0,
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        top: '-100px', left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            overflow: 'hidden', boxShadow: '0 0 24px rgba(59,130,246,0.4)',
          }}>
            <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Huntlo<span style={{ color: 'var(--accent-blue)' }}> OS</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            One-time setup required
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Connect your Supabase database to unlock all features.<br />
            Takes about <strong style={{ color: 'var(--text-primary)' }}>2 minutes</strong>.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'var(--accent-blue-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-blue)', flexShrink: 0, marginTop: '1px',
                }}>
                  <step.icon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
                      STEP {step.num}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {step.title}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>

                  {step.link && (
                    <a href={step.link} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      marginTop: '8px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--accent-blue)', textDecoration: 'none',
                    }}>
                      {step.linkLabel} <ExternalLink size={11} />
                    </a>
                  )}

                  {step.code && (
                    <div style={{
                      marginTop: '10px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--bg-border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 12px',
                        borderBottom: '1px solid var(--bg-border)',
                      }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                          .env
                        </span>
                        <CopyButton text={envTemplate} />
                      </div>
                      <pre style={{
                        margin: 0, padding: '12px',
                        fontSize: '11.5px', color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono, monospace)',
                        lineHeight: 1.7, overflowX: 'auto',
                      }}>
                        {envTemplate}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* After setup hint */}
        <div style={{
          background: 'var(--accent-blue-muted)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <ArrowRight size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            After creating <code style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>.env</code> and
            restarting the dev server with <code style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>npm run dev</code>,
            the login page will be ready. Use the email and password you set in Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
