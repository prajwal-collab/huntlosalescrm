/**
 * Computes a signal score for a lead based on its signals and engagement data.
 * @param {Object} lead - The lead object to score
 * @returns {number} Score from 0 to 100
 */
export function computeSignalScore(lead) {
  const s = lead.signals || {};
  let score = 0;
  if (s.hiring_activity)      score += 25;
  if (s.recruiter_hiring)     score += 20;
  if (s.funding_activity)     score += 20;
  if (s.linkedin_activity)    score += 10;
  if (s.job_posting_activity) score += 10;
  if (s.company_growth)       score += 10;
  if (lead.demo_requested)    score += 20;
  if (lead.positive_interest) score += 15;
  if (lead.reply_status === 'Positive') score += 20;
  if (lead.email_status === 'Replied')  score += 15;
  return Math.min(score, 100);
}

/**
 * Returns a priority label for a given score.
 * @param {number} score - The signal score
 * @returns {string} Priority string ('Hot', 'Warm', or 'Cold')
 */
export function getPriority(score) {
  if (score >= 70) return 'Hot';
  if (score >= 35) return 'Warm';
  return 'Cold';
}
