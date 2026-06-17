// ============================================
// HUNTLO SALES OS — SEED DATA FOR DEMO MODE
// ============================================

export const SEED_COMPANIES = [
  {
    id: 'comp-1',
    name: 'Stripe',
    industry: 'Fintech',
    size: '1000-5000',
    arr_estimate: 41666,
    engagement_score: 92,
    website: 'https://stripe.com',
    linkedin: 'https://linkedin.com/company/stripe',
    tags: ['enterprise', 'high-growth', 'fintech'],
    notes: 'Strategic account. Highly interested in our premium automation suites.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'comp-2',
    name: 'Linear',
    industry: 'Software',
    size: '50-100',
    arr_estimate: 7000,
    engagement_score: 78,
    website: 'https://linear.app',
    linkedin: 'https://linkedin.com/company/linear-app',
    tags: ['saas', 'product-led', 'hot-lead'],
    notes: 'Evaluating integrations. Technical fit is extremely strong.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'comp-3',
    name: 'Notion',
    industry: 'Collaboration',
    size: '500-1000',
    arr_estimate: 20000,
    engagement_score: 65,
    website: 'https://notion.so',
    linkedin: 'https://linkedin.com/company/notion-so',
    tags: ['collaboration', 'mid-market', 'active-eval'],
    notes: 'Procurement checking compliance details. Proposal sent.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'comp-4',
    name: 'Supabase',
    industry: 'Database',
    size: '100-250',
    arr_estimate: 10000,
    engagement_score: 85,
    website: 'https://supabase.com',
    linkedin: 'https://linkedin.com/company/supabase',
    tags: ['developer-tools', 'open-source', 'closed-won'],
    notes: 'Closed Won. Onboarding session completed.',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'comp-5',
    name: 'Vercel',
    industry: 'Hosting',
    size: '250-500',
    arr_estimate: 15000,
    engagement_score: 45,
    website: 'https://vercel.com',
    linkedin: 'https://linkedin.com/company/vercel',
    tags: ['developer-tools', 'frontend', 'follow-up'],
    notes: 'Replied on LinkedIn. Needs a nudge for discovery call.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export const SEED_CONTACTS = [
  {
    id: 'cont-1',
    company_id: 'comp-1',
    name: 'Emily Chen',
    email: 'emily.chen@stripe.com',
    designation: 'CTO',
    role: 'Decision Maker',
    sentiment: 'positive',
    engagement_score: 95,
    linkedin: 'https://linkedin.com/in/emily-chen-stripe',
    whatsapp: '+1-555-0192',
    timezone: 'PST',
    tags: ['technical', 'champion'],
    notes: 'Very technical, likes API-first workflows.',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString()
  },
  {
    id: 'cont-2',
    company_id: 'comp-2',
    name: 'Mia Zhou',
    email: 'mia@linear.app',
    designation: 'VP Product',
    role: 'Decision Maker',
    sentiment: 'positive',
    engagement_score: 85,
    linkedin: 'https://linkedin.com/in/mia-zhou-linear',
    whatsapp: '+1-555-0283',
    timezone: 'EST',
    tags: ['product-oriented', 'decision-maker'],
    notes: 'Wants to see custom workflow customization.',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: 'cont-3',
    company_id: 'comp-3',
    name: 'James Park',
    email: 'james.park@notion.so',
    designation: 'VP Engineering',
    role: 'Evaluator',
    sentiment: 'neutral',
    engagement_score: 60,
    linkedin: 'https://linkedin.com/in/james-park-notion',
    whatsapp: '+1-555-0374',
    timezone: 'EST',
    tags: ['procurement', 'engineering'],
    notes: 'Concerned about multi-region data availability.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'cont-4',
    company_id: 'comp-4',
    name: 'Paul Copplestone',
    email: 'coops@supabase.io',
    designation: 'CEO',
    role: 'Decision Maker',
    sentiment: 'positive',
    engagement_score: 90,
    linkedin: 'https://linkedin.com/in/paul-copplestone',
    whatsapp: '+1-555-0465',
    timezone: 'SGT',
    tags: ['executive', 'founder'],
    notes: 'Signed deal. Friendly contact.',
    created_at: new Date(Date.now() - 38 * 86400000).toISOString()
  },
  {
    id: 'cont-5',
    company_id: 'comp-5',
    name: 'Lee Robinson',
    email: 'lee@vercel.com',
    designation: 'VP Developer Experience',
    role: 'Influencer',
    sentiment: 'neutral',
    engagement_score: 50,
    linkedin: 'https://linkedin.com/in/leerob',
    whatsapp: '+1-555-0556',
    timezone: 'EST',
    tags: ['developer-relations', 'dx'],
    notes: 'Discussing developer portal access possibilities.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

export const SEED_DEALS = [
  {
    id: 'deal-1',
    company_id: 'comp-1',
    owner_id: 'demo-user-1',
    title: 'Stripe Enterprise Global Integration',
    arr: 26666,
    stage: 'Negotiation',
    engagement_score: 92,
    urgency: 'urgent',
    next_step: 'Finalize legal clause 4.2 regarding SLAs',
    notes: 'Redlines exchanged. Waiting on Stripe legal counsel review.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    last_activity: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'deal-2',
    company_id: 'comp-2',
    owner_id: 'demo-user-1',
    title: 'Linear Workspace Q3 Expansion',
    arr: 7000,
    stage: 'Proposal',
    engagement_score: 78,
    urgency: 'medium',
    next_step: 'Deliver customized workflow demo video',
    notes: 'Demo completed. Sent proposal pricing grid.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    last_activity: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'deal-3',
    company_id: 'comp-3',
    owner_id: 'demo-user-1',
    title: 'Notion Enterprise Partnership',
    arr: 20000,
    stage: 'Proposal',
    engagement_score: 65,
    urgency: 'high',
    next_step: 'Follow up on proposal view statistics',
    notes: 'James Park viewed the proposal PDF 4 times this morning.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    last_activity: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'deal-4',
    company_id: 'comp-4',
    owner_id: 'demo-user-1',
    title: 'Supabase Launch Partnership',
    arr: 10000,
    stage: 'Closed Won',
    engagement_score: 85,
    urgency: 'low',
    next_step: 'Pass to success team for onboarding',
    notes: 'Contract signed on DocuSign. Payment received.',
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    last_activity: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 'deal-5',
    company_id: 'comp-5',
    owner_id: 'demo-user-1',
    title: 'Vercel Team Upgrade',
    arr: 6250,
    stage: 'Discovery',
    engagement_score: 45,
    urgency: 'low',
    next_step: 'Set up discovery call with Lee Robinson',
    notes: 'Initial outreach replied. Searching for a suitable date.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_activity: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

export const SEED_TASKS = [
  {
    id: 'task-1',
    deal_id: 'deal-1',
    owner_id: 'demo-user-1',
    title: 'Review redlines with corporate counsel',
    type: 'legal',
    priority: 'high',
    status: 'pending',
    due: new Date(Date.now() + 2 * 86400000).toISOString(),
    notes: 'Crucial for clause 4.2.',
    created_at: new Date().toISOString()
  },
  {
    id: 'task-2',
    deal_id: 'deal-2',
    owner_id: 'demo-user-1',
    title: 'Record custom demo walkthrough',
    type: 'demo',
    priority: 'medium',
    status: 'pending',
    due: new Date(Date.now() + 3 * 86400000).toISOString(),
    notes: 'Keep it under 5 minutes. Show custom transitions.',
    created_at: new Date().toISOString()
  },
  {
    id: 'task-3',
    deal_id: 'deal-3',
    owner_id: 'demo-user-1',
    title: 'Follow up email to James',
    type: 'email',
    priority: 'high',
    status: 'pending',
    due: new Date(Date.now() - 1 * 86400000).toISOString(), // Overdue task!
    notes: 'Ask if they have any comments on the proposal.',
    created_at: new Date().toISOString()
  }
];

export const SEED_MEETINGS = [
  {
    id: 'meet-1',
    deal_id: 'deal-2',
    owner_id: 'demo-user-1',
    title: 'Linear Custom Workflow Sync',
    type: 'demo',
    date: new Date(Date.now() + 1 * 86400000).toISOString(),
    duration: 30,
    platform: 'Google Meet',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    status: 'scheduled',
    attendees: ['mia@linear.app', 'alex.reid@huntlo.io'],
    notes: 'Walk through workflow integrations and customize settings in real-time.',
    ai_summary: '',
    next_action: '',
    pain_points: [],
    objections: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'meet-2',
    deal_id: 'deal-1',
    owner_id: 'demo-user-1',
    title: 'Stripe Pricing Negotiation Call',
    type: 'negotiation',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration: 45,
    platform: 'Zoom',
    meeting_link: 'https://zoom.us/j/987654321',
    status: 'completed',
    attendees: ['emily.chen@stripe.com', 'alex.reid@huntlo.io'],
    notes: 'Negotiated MRR from $29k to $26k for multi-year contract.',
    ai_summary: 'Stripe requested a price reduction in exchange for a 3-year term. Agreed to $26k MRR. Agreed SLA to be finalized.',
    next_action: 'Send contract draft with $26k MRR',
    pain_points: ['Budget approval limits', 'SLA strictness'],
    objections: ['Price too high for standard tier'],
    created_at: new Date().toISOString()
  }
];

export const SEED_DOCUMENTS = [
  {
    id: 'doc-1',
    company_id: 'comp-3',
    name: 'Notion Enterprise Proposal V2',
    type: 'PDF',
    size: '1.4 MB',
    owner_id: 'demo-user-1',
    url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    views: 4,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'doc-2',
    company_id: 'comp-1',
    name: 'Stripe SLA Draft & Redlines',
    type: 'DOCX',
    size: '0.8 MB',
    owner_id: 'demo-user-1',
    url: 'https://docs.google.com/document/d/1example',
    views: 1,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const SEED_SEQUENCES = [
  {
    id: 'seq-1',
    name: 'Outbound Founder/CTO Outreach',
    status: 'active',
    steps: 3,
    enrolled: 18,
    reply_rate: 22.4,
    channel: 'Multi-channel',
    nodes: [
      {
        id: 'node-1',
        type: 'email',
        day: 1,
        subject: 'Huntlo OS — API-first Sales Platform',
        content: 'Hi {{firstName}}, noticed you are building at {{company}}. Would love to show you how Huntlo speeds up outreach...'
      },
      {
        id: 'node-2',
        type: 'delay',
        label: 'Wait 3 days'
      },
      {
        id: 'node-3',
        type: 'linkedin',
        day: 4,
        content: 'Send connection request: Hi {{firstName}}, wanted to connect regarding developer-led pipelines.'
      }
    ],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'seq-2',
    name: 'Mid-Market Nurture Flow',
    status: 'inactive',
    steps: 1,
    enrolled: 0,
    reply_rate: 0,
    channel: 'Email Only',
    nodes: [],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];
