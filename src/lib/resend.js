// ============================================
// HUNTLO SALES OS — RESEND EMAIL CLIENT
// ============================================

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const isConfigured = RESEND_API_KEY && RESEND_API_KEY !== 'your_resend_api_key';

// Send team invitation email via Resend
export async function sendTeamInvitation({ toEmail, toName, inviterName, role, inviteToken }) {
  if (!isConfigured) {
    console.warn('[Resend] Not configured. Simulating email send.');
    await new Promise(r => setTimeout(r, 800));
    return { success: true, demo: true, message: 'Demo mode: Email would be sent via Resend.' };
  }

  const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #0a0a0b; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #111114; border: 1px solid #222229; border-radius: 14px; overflow: hidden; }
    .header { background: #111114; padding: 32px 40px 24px; border-bottom: 1px solid #222229; }
    .logo { font-size: 18px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.02em; }
    .logo span { color: #3b82f6; }
    .body { padding: 32px 40px; }
    h1 { font-size: 22px; font-weight: 600; color: #f0f0f5; margin: 0 0 12px; }
    p { font-size: 14px; color: #8b8b9a; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; }
    .meta { margin-top: 28px; padding-top: 20px; border-top: 1px solid #222229; font-size: 12px; color: #4a4a5a; }
    .badge { display: inline-block; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Huntlo <span>Sales OS</span></div>
    </div>
    <div class="body">
      <div class="badge">${role}</div>
      <h1>You're invited to join the team</h1>
      <p>
        <strong style="color: #f0f0f5">${inviterName}</strong> has invited you to join 
        <strong style="color: #f0f0f5">Huntlo Sales OS</strong> — an AI-native enterprise 
        sales operating system. You've been assigned the <strong style="color: #f0f0f5">${role}</strong> role.
      </p>
      <p>Click below to accept the invitation and set up your account:</p>
      <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
      <div class="meta">
        This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.<br/>
        © 2026 Huntlo Sales OS
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Huntlo Sales OS <onboarding@resend.dev>',
        to: [toEmail],
        subject: `${inviterName} invited you to Huntlo Sales OS`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send email');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Resend] Error:', err);
    return { success: false, error: err.message };
  }
}

// Generate a simple invite token
export function generateInviteToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Send a plain text B2B sales sequence email
export async function sendSequenceEmail({ toEmail, subject, body, fromName = 'Huntlo Sales', replyTo }) {
  if (!isConfigured) {
    console.warn(`[Resend] Demo Mode: Would send sequence email to ${toEmail}. Subject: ${subject}`);
    await new Promise(r => setTimeout(r, 600));
    return { success: true, demo: true, message: `Demo mode: Sent to ${toEmail}` };
  }

  // Convert plain text body with newlines to HTML paragraphs for standard B2B look
  const htmlBody = body.split('\n').map(line => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1f2937;">${line}</p>`).join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [toEmail],
        reply_to: replyTo,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send sequence email');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Resend Sequence Error]:', err);
    return { success: false, error: err.message };
  }
}

export { isConfigured as isResendConfigured };
