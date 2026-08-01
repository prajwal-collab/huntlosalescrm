/**
 * HUNTLO LEAD SCORING ENGINE v2.0
 * ─────────────────────────────────────────────────────────────
 * Scores a lead 0–100 based on:
 *  • Engagement signals (hiring, funding, LinkedIn etc.)
 *  • Call outcomes (connected calls are strong positive signal)
 *  • Stage progression (further along = higher base)
 *  • Activity recency (decays if no contact in 7–30 days)
 *  • Lead completeness (phone, email, notes filled in)
 * ─────────────────────────────────────────────────────────────
 */

const STAGE_BONUS = {
  'New Lead':           0,
  'Researching':        2,
  'Ready for Outreach': 5,
  'Outreach Started':   8,
  'Engaged':            15,
  'Qualified':          20,
  'Demo Scheduled':     25,
  'Demo Complete':      28,
  'Trial Started':      30,
  'Customer':           0,  // already won, exclude from active scoring
  'Lost':               0,
};

export function computeSignalScore(lead) {
  if (lead.stage === 'Customer' || lead.stage === 'Lost') return 0;

  const s = lead.signals || {};
  let score = 0;

  // ── Engagement signals ──────────────────────────────────────
  if (s.hiring_activity)      score += 20;
  if (s.recruiter_hiring)     score += 15;
  if (s.funding_activity)     score += 18;
  if (s.linkedin_activity)    score += 8;
  if (s.job_posting_activity) score += 8;
  if (s.company_growth)       score += 8;

  // ── Intent signals ──────────────────────────────────────────
  if (lead.demo_requested)    score += 20;
  if (lead.positive_interest) score += 12;
  if (lead.reply_status === 'Positive') score += 15;
  if (lead.email_status === 'Replied')  score += 10;

  // ── Call outcomes (parsed from notes) ──────────────────────
  const notes = (lead.notes || '').toLowerCase();
  const connectedCalls = (notes.match(/connected/g) || []).length;
  const voicemailCalls = (notes.match(/voicemail/g) || []).length;
  score += Math.min(connectedCalls * 8, 24);  // max +24 for calls
  score += Math.min(voicemailCalls * 2, 6);   // max +6 for voicemails

  // ── Stage bonus ─────────────────────────────────────────────
  score += (STAGE_BONUS[lead.stage] || 0);

  // ── Activity recency decay ──────────────────────────────────
  // If the lead has been untouched for >7 days, apply a decay
  const lastActivity = lead.updated_at || lead.created_at;
  if (lastActivity) {
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / 86400000;
    if (daysSince > 30)     score -= 20;
    else if (daysSince > 14) score -= 10;
    else if (daysSince > 7)  score -= 5;
  }

  return Math.max(0, Math.min(score, 100));
}

/**
 * Returns a priority label for a given score.
 */
export function getPriority(score) {
  if (score >= 70) return 'Hot';
  if (score >= 35) return 'Warm';
  return 'Cold';
}

/**
 * Computes a lead completeness score (0–100%).
 * Encourages SDRs to fill in all data fields.
 */
export function computeCompleteness(lead) {
  const fields = [
    lead.company_name,
    lead.contact_name,
    lead.email,
    lead.phone,
    lead.stage && lead.stage !== 'New Lead',
    lead.notes && lead.notes.length > 20,
    lead.source,
    lead.next_action,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Returns a colour for a given completeness % 
 */
export function getCompletenessColor(pct) {
  if (pct >= 80) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
}

/**
 * Checks if a lead is stale (no activity in N days).
 */
export function isLeadStale(lead, days = 14) {
  const lastActivity = lead.updated_at || lead.created_at;
  if (!lastActivity) return false;
  const daysSince = (Date.now() - new Date(lastActivity).getTime()) / 86400000;
  return daysSince > days;
}
