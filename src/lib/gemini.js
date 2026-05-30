// ============================================
// HUNTLO SALES OS — GEMINI AI CLIENT (Dynamic Key)
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai';

// System context for Huntlo Sales OS
const SYSTEM_CONTEXT = `You are the AI assistant for Huntlo Sales OS, an enterprise sales operating system. 
You help sales teams manage their pipeline, follow up on deals, draft outreach messages, and gain 
operational intelligence. Keep responses concise, actionable, and sales-focused. 
Format responses clearly. Do not use markdown headers. Use bullet points sparingly.`;

// Mock responses for demo mode
const MOCK_RESPONSES = {
  default: "I'm running in demo mode. Connect your Gemini API key under Settings > Integrations to enable live AI responses.",
  'hot leads': '🔥 Hot leads right now:\n• Stripe (CTO engaged, demo scheduled tomorrow)\n• Linear (In legal review, close by EOM)\n• Anthropic (Strategic deal, $320k ARR)',
  'stale deals': '⚠️ Stale deals needing attention:\n• Vercel — 3 days no response, follow up via LinkedIn\n• Resend — 5 days since outreach, try a new angle\n• Railway — Never contacted, schedule outreach today',
  'follow up': '📧 Suggested follow-up for Notion (proposal sent 2 days ago):\n\nSubject: Re: Huntlo Proposal — Quick Check-in\n\nHi James,\n\nWanted to follow up on the proposal I sent over. Happy to walk through any questions or adjust the pricing structure if needed.\n\nAre you free for a 15-minute call this week?\n\nBest,\nAlex',
  'pipeline': '📊 Pipeline snapshot:\n• 2 deals in negotiation ($336k combined ARR)\n• 3 demos scheduled this week\n• $684k in proposal stage\n• Forecast this month: $120k (PlanetScale closed)',
  'demo': 'Upcoming demos this week:\n• Stripe — Tomorrow 2PM PST with Emily Chen (CTO)\n• Anthropic — Friday 11AM PST with Lisa Wang (CISO) + Ryan Chen (VP Eng)',
};

function getMockResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('hot') || q.includes('lead')) return MOCK_RESPONSES['hot leads'];
  if (q.includes('stale') || q.includes('inactive')) return MOCK_RESPONSES['stale deals'];
  if (q.includes('follow') || q.includes('email') || q.includes('outreach')) return MOCK_RESPONSES['follow up'];
  if (q.includes('pipeline') || q.includes('deal') || q.includes('revenue')) return MOCK_RESPONSES['pipeline'];
  if (q.includes('demo') || q.includes('meeting') || q.includes('schedule')) return MOCK_RESPONSES['demo'];
  return MOCK_RESPONSES.default;
}

// Get the active Gemini key securely
function getGeminiApiKey() {
  const customKey = localStorage.getItem('huntlo_gemini_api_key');
  if (customKey && customKey.trim() !== '') return customKey.trim();
  
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'your_gemini_api_key') return envKey;
  
  return null;
}

export function isGeminiConfigured() {
  return getGeminiApiKey() !== null;
}

// Main AI query function
export async function queryGemini(prompt, context = '') {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 600)); // simulate latency
    return getMockResponse(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = `${SYSTEM_CONTEXT}\n\n${context ? `Context: ${context}\n\n` : ''}User query: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('[Gemini] Error:', err);
    return getMockResponse(prompt);
  }
}

// Generate follow-up email
export async function generateFollowUp(dealName, stage, lastActivity, contactName) {
  const prompt = `Generate a concise, professional sales follow-up email for:
- Company: ${dealName}
- Deal stage: ${stage}
- Last activity: ${lastActivity}
- Contact: ${contactName}
Keep it under 100 words. No fluff. Direct and value-focused.`;
  return queryGemini(prompt);
}

// Generate AI insights for a company
export async function generateCompanyInsight(companyName, industry, engagementScore, dealStage) {
  const prompt = `Provide 2-3 brief tactical insights for this sales opportunity:
- Company: ${companyName} (${industry})
- Engagement score: ${engagementScore}/100
- Current stage: ${dealStage}
Be specific and actionable. Max 3 bullet points.`;
  return queryGemini(prompt);
}

// Generate sequence step content
export async function generateSequenceStep(stepType, companyName, contactName, persona) {
  const prompt = `Write a ${stepType} outreach message for:
- Company: ${companyName}
- Contact: ${contactName} (${persona})
- Channel: ${stepType}
Keep it under 80 words. Personalized and specific.`;
  return queryGemini(prompt);
}
