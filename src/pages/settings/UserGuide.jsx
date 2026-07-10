// ============================================
// HUNTLO SALES OS — USER GUIDE
// Complete CRM usage documentation
// ============================================
import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, BookOpen,
  Target, BarChart3, Building2, Users, CheckSquare,
  Calendar, Zap, FileText, TrendingUp, Sparkles,
  ArrowRight, Link2, Play, Star, Info, AlertCircle,
  Globe, Mail, Phone, MessageCircle, Settings, Layers, Video
} from 'lucide-react';
import '../UserGuide.css';


// ── Data ──────────────────────────────────────────────────────
const GUIDE_SECTIONS = [
  {
    id: 'quickstart',
    icon: Play,
    color: '#3b82f6',
    title: '🚀 Quick Start — Your First Week',
    description: 'Get up and running in 15 minutes',
    badge: 'Start Here',
    articles: [
      {
        title: 'The Ideal Sales Flow in Huntlo',
        content: `
Huntlo is designed around a single, logical flow. You enter data once, and the system automatically links everything:

**Step 1 → Add a Lead**
Go to Leads → Click "Add Lead". Fill in Company + Contact details.
✅ Huntlo will automatically create a Company account and Contact record — no re-entry needed.

**Step 2 → Qualify & Move the Lead Through Stages**
Use the Stage dropdown on each lead row (New Lead → Researching → Ready for Outreach → Engaged → Qualified → Demo Scheduled → Demo Complete → Trial Started → Customer).

**Step 3 → Schedule a Meeting**
From Meetings → Add Meeting. Link it to the relevant Deal or Lead. If you've connected Google Workspace, it auto-creates a Google Calendar event with a Meet link.

**Step 4 → Convert to a Deal (One Click)**
On the Leads page, click the "→ Deal" button on any qualified lead. The Deal form pre-fills with the company, contact, and MRR from the lead — zero re-entry.

**Step 5 → Manage the Deal in Pipeline**
The kanban board shows all 7 stages. Drag cards between columns. Open any deal to add tasks, proposals, notes, and track contacts.

**Step 6 → Send a Proposal**
Inside a Deal → Proposals tab → Create Proposal with line items. Track status: Draft → Sent → Viewed → Accepted/Rejected.

**Step 7 → Win the Deal**
Move the deal to "Closed Won". Your Dashboard MRR and conversion rate update instantly.
`,
      },
      {
        title: 'Dashboard — Your Command Centre',
        content: `
The Dashboard (HomeOS) gives you a real-time overview of your entire pipeline.

**6 Key Metrics (Stats Row):**
- **Pipeline MRR** — Total monthly recurring revenue across all active deals
- **Won MRR** — Revenue from Closed Won deals this month
- **Active Deals** — Deals not yet closed (won or lost)
- **Hot Leads** — Leads with a Signal Score ≥ 70
- **Proposals Out** — Proposals sent but not yet accepted/rejected
- **Lead → Deal Rate** — Your pipeline conversion percentage

**Today's Priorities Grid:**
8 priority cards show your most urgent items. Click any card to jump directly to the relevant page.

**AI Sales Intelligence:**
Type any question in the AI bar — e.g.:
- "Which leads need follow-up this week?"
- "Generate a follow-up email for Acme Corp"
- "What's my pipeline forecast for this quarter?"

**Activity Feed:**
Live timeline of all actions — deals moved, leads added, meetings scheduled, documents uploaded — across your whole team.
`,
      },
    ],
  },
  {
    id: 'leads',
    icon: Target,
    color: '#dc2626',
    title: '🎯 Leads',
    description: 'Signal-driven lead management',
    articles: [
      {
        title: 'Adding a Lead',
        content: `
Go to **Leads** in the sidebar → Click **Add Lead** (top right).

**What to fill in:**
- **Company Name** (Required) — Huntlo checks if this company already exists. If yes, it links to the existing account. If no, it auto-creates a new Company record.
- **Company Type** — Recruitment Agency, Staffing Firm, Startup, Enterprise, Other
- **Website, LinkedIn, Industry, Location** — Optional but recommended for signal scoring
- **Primary Contact** — Name, designation, email, phone/WhatsApp
- **Initial Signals** — Toggle any active buying signals (Hiring Activity, Funding Activity, etc.)
- **Next Action** — Set a specific task with due date and priority
- **Est. MRR** — Your revenue estimate for this lead

💡 **Auto-Link:** When you save a Lead, Huntlo automatically creates:
- A Company record (if it doesn't exist)
- A Contact record linked to that company

This means you never need to add the same company or person twice.
`,
      },
      {
        title: 'Signal Scoring Explained',
        content: `
Every lead gets a **Signal Score** from 0–100 calculated from:

| Signal | Points |
|--------|--------|
| Hiring Activity | +20 |
| Recruiter Hiring | +25 |
| Funding Activity | +15 |
| LinkedIn Activity | +10 |
| Job Posting Activity | +15 |
| Company Growth | +15 |

**Score Bands:**
- 🔴 **70–100** — Hot Lead (ready for outreach now)
- 🟡 **35–69** — Warm Lead (needs nurturing)
- ⚫ **0–34** — Cold Lead

**Priority is auto-calculated:** High / Medium / Low based on score.

**Hot Leads view:** Click "🔥 Hot Leads" in the Smart Views bar to see only leads scoring 70+.
`,
      },
      {
        title: 'Smart Views & Filters',
        content: `
The **Smart Views bar** at the top of Leads gives you instant filtered lists:

- **All Leads** — Every lead in your workspace
- **🔥 Hot Leads** — Score ≥ 70, stage ≠ Lost
- **📈 Buying Signals** — Leads with active signals (hiring, funding, etc.)
- **⏰ Needs Follow-up** — Next action due date has passed
- **📅 Demo Scheduled** — All leads in Demo Scheduled stage
- **🧪 Trial Users** — All leads in Trial Started stage
- **❌ Lost** — Lost leads for analysis
- **💰 High MRR Potential** — Est. MRR ≥ ₹500/mo

**Additional Filters (Filter button):**
- Filter by Stage, Source, Date range added

**Search:** Type any company name, contact name, or email — instant results.

**Views:** Switch between **List view** (table) and **Board view** (kanban by stage) using the toggle icons.
`,
      },
      {
        title: 'Convert Lead → Deal (One Click)',
        content: `
When a lead is ready to become a deal:

1. Find the lead row in the Leads table
2. Click the **"→ Deal"** button on the far right of the row
3. A Deal form opens — **pre-filled** with:
   - Company name matched to your Companies
   - Contact pre-selected from linked contact records
   - MRR from the lead's estimated MRR
4. Choose a pricing plan, set urgency → Save Deal
5. The deal appears immediately in the Pipeline kanban at **Discovery** stage

💡 The lead stays in Leads — it's not removed. Update the lead stage to "Trial Started" or "Customer" to reflect progress.
`,
      },
      {
        title: 'Lead Stages & What They Mean',
        content: `
Move leads through stages by clicking the Stage dropdown on any lead row (no page refresh needed):

| Stage | Meaning |
|-------|---------|
| **New Lead** | Just added — not yet researched |
| **Researching** | Actively gathering info about this company |
| **Ready for Outreach** | Research done — ready to contact |
| **Outreach Started** | First contact sent (email/LinkedIn/WhatsApp) |
| **Engaged** | Prospect has replied or shown interest |
| **Qualified** | Confirmed they have budget + need + authority |
| **Demo Scheduled** | Formal meeting booked |
| **Demo Complete** | Demo done — awaiting decision |
| **Trial Started** | Using product on trial |
| **Customer** | Converted — paying customer |
| **Lost** | Deal lost — note the reason in Notes |
`,
      },
    ],
  },
  {
    id: 'pipeline',
    icon: BarChart3,
    color: '#8b5cf6',
    title: '📊 Pipeline',
    description: 'Deal management and forecasting',
    articles: [
      {
        title: 'Understanding the Pipeline Kanban',
        content: `
The Pipeline page shows all your deals organized in a **7-stage kanban board**:

**Stages:**
1. **Discovery** — Initial conversation started
2. **Qualification** — Assessing fit and budget
3. **Trial** — Product trial in progress
4. **Proposal** — Formal proposal sent
5. **Negotiation** — Terms being negotiated
6. **Closed Won** ✅ — Deal signed
7. **Closed Lost** ❌ — Deal lost

**Each Deal Card shows:**
- Company name + contact
- MRR value
- Engagement score bar (0–100)
- Urgency dot (color coded)
- Last activity time
- Owner avatar
- Next step text

**Dragging:** Drag any deal card to a different column to move its stage. The stage updates in real-time to Supabase.
`,
      },
      {
        title: 'Adding a Deal',
        content: `
**Option A: From Pipeline Page**
Click **"Add Deal"** in the top toolbar.

**Option B: Convert from Lead (Recommended)**
On the Leads page, click "→ Deal" on any lead row — form pre-fills automatically.

**Deal Form Fields:**
- **Deal Title** — e.g. "Acme Corp — Enterprise Q3"
- **Company / Account** — Dropdown with search. Shows Lead data for each company.
- **Primary Contact** — Auto-loaded from contacts linked to that company
- **Pricing Plan** — Trial (₹0), Starter (₹8,299/mo), Growth (₹24,999/mo), or Enterprise (custom)
- **Urgency** — Low / Medium / High / Urgent

All deals start at **Discovery** stage.
`,
      },
      {
        title: 'Deal Drawer — 7 Tabs',
        content: `
Click any deal card to open its drawer. It has 7 tabs:

**Overview**
- Key metrics: Engagement score, Urgency, Deal Value, Last Activity
- Deal notes
- Next step
- Quick actions: Draft Follow-up (AI), View Proposals, Schedule Meeting

**Proposals**
Create and track proposals with line items. Statuses: Draft → Sent → Viewed → Accepted / Rejected / Expired.
Stats bar shows total sent, accepted count, and total won value.

**Activity**
Log notes and activities. Full timeline of every note, email, call, meeting, and proposal event.

**Contacts**
Shows all real Contact records linked to this deal's company. Includes email/WhatsApp quick-action buttons.

**Notes**
Free-form notes editor — save deal context, call summaries, next steps. Auto-saved to database.

**Tasks**
Add, complete, and delete tasks specific to this deal. Type task → set due date → press Add.
Tasks with past due dates show in red. Check to complete them.

**AI Insights**
One-click AI analysis: get tactical recommendations for this specific deal based on its stage, engagement, and industry.
`,
      },
      {
        title: 'Filters & Search',
        content: `
**Search bar** — Search by deal title or company name.

**Filter chips:**
- **All** — All deals
- **Hot** — High engagement score deals
- **Stale** — Deals with no activity in 5+ days
- **Urgent** — Deals marked Urgent

**Pipeline MRR shown per column:** Each kanban column shows the total MRR of all deals in that stage.
`,
      },
    ],
  },
  {
    id: 'companies',
    icon: Building2,
    color: '#f97316',
    title: '🏢 Companies (Accounts)',
    description: 'Account intelligence and management',
    articles: [
      {
        title: 'Companies Overview',
        content: `
The **Companies** page (labelled "Accounts" in the sidebar) shows all organization-level records.

**Companies are created automatically when you:**
- Add a new Lead with a company name that doesn't exist yet
- Import contacts or companies via CSV

**Manually add a Company:**
Click **"Add Company"** → fill in Name, Website, Industry, Size, ARR Estimate.

**Company Row shows:**
- Company logo (auto-generated initial)
- Website link
- Industry
- Size (employee count)
- ARR estimate
- Contact count (number of contacts linked to this company)
- Engagement score
- Tags

**Bulk actions:** Select multiple companies → Bulk Edit (update industry, tags, etc.) or Bulk Delete.

**Export:** Download all companies as CSV with the Export button.
`,
      },
      {
        title: 'Linking Companies to Leads & Deals',
        content: `
Every Company is automatically the hub for:

- **Leads** — Leads with matching company name are auto-linked
- **Contacts** — All contacts with company_id pointing to this company
- **Deals** — Deals created for this company appear in the deal drawer

When you open a Deal and go to the **Contacts** tab, you see all contacts belonging to that company — automatically, no manual linking.

💡 **Best practice:** Always let Huntlo auto-create companies from Leads. Avoid manually adding duplicate company names.
`,
      },
    ],
  },
  {
    id: 'contacts',
    icon: Users,
    color: '#06b6d4',
    title: '👥 Contacts',
    description: 'People and relationship tracking',
    articles: [
      {
        title: 'Contacts Overview',
        content: `
The **Contacts** page shows all individual people in your CRM.

**Contacts are created automatically when you:**
- Add a Lead with a contact name or email — Huntlo creates the contact record
- Import contacts via CSV — companies are auto-created if they don't exist

**Manually add a Contact:**
Click **"Add Contact"** → fill in Name, Email, WhatsApp/Phone, Designation, LinkedIn, and select a Company.

**Contact Row shows:**
- Avatar (auto-generated)
- Name + Designation
- Company name (clickable if company exists)
- Email with one-click copy
- WhatsApp / Phone
- LinkedIn link
- Tags
- Last activity

**Bulk actions:** Bulk Edit, Bulk Delete, Enroll in Sequence.
`,
      },
      {
        title: 'Reaching Out Directly',
        content: `
From any Contact row, you can:

- 📧 **Email** — Click the email icon to open your email client
- 📱 **WhatsApp** — Click the WhatsApp icon to open wa.me with their number
- 🔗 **LinkedIn** — Click LinkedIn icon to open their profile in a new tab
- 📋 **Copy** — Copy email or phone number to clipboard with one click

From the **Deal Drawer → Contacts tab**, you can also email or WhatsApp directly from within the deal context.
`,
      },
    ],
  },
  {
    id: 'meetings',
    icon: Calendar,
    color: '#7c3aed',
    title: '📅 Meetings',
    description: 'Meeting scheduling and calendar sync',
    articles: [
      {
        title: 'Scheduling a Meeting',
        content: `
Go to **Meetings** → Click **"Schedule Meeting"**.

**Meeting Fields:**
- **Title** — e.g. "Acme Corp Discovery Call"
- **Date & Time** — Pick date + time
- **Duration** — 15, 30, 45, 60 mins (default 30)
- **Platform** — Google Meet, Zoom, Teams, Phone, In Person
- **Linked Deal** — Select the related deal (optional but recommended)
- **Notes** — Agenda, prep notes, etc.

**Google Calendar Auto-Sync:**
If you've connected Google Workspace (Settings → Integrations), saving a meeting:
- Creates a Google Calendar event automatically
- Generates a Google Meet link if platform is set to Google Meet
- Invites the primary contact from the linked deal

💡 No Google? Meetings are still saved in Huntlo — you just won't get the auto-generated Meet link.
`,
      },
      {
        title: 'Meeting Statuses',
        content: `
| Status | Meaning |
|--------|---------|
| **Scheduled** | Meeting confirmed and upcoming |
| **Completed** | Meeting has happened |
| **Cancelled** | Meeting was cancelled |
| **No Show** | Prospect didn't attend |

Update status by clicking the status badge in the meeting row or inside the meeting detail.

**Today's Meetings** appear on the Dashboard under "Today's Priorities".
**This Week's Meetings** count shown in the priorities grid.
`,
      },
    ],
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    color: '#16a34a',
    title: '✅ Tasks',
    description: 'Task management and follow-ups',
    articles: [
      {
        title: 'Creating and Managing Tasks',
        content: `
Tasks in Huntlo can be created from two places:

**1. Tasks Page (Global Tasks)**
Sidebar → Tasks → "Add Task".
Set title, due date, priority, and assign to a team member.

**2. Deal Drawer → Tasks Tab (Deal-Specific Tasks)**
Open any deal → Tasks tab → Type task title → set due date → click Add.
These tasks are linked to that specific deal.

**Task Statuses:**
- **Pending** — Not yet done
- **In Progress** — Being worked on
- **Completed** — Done ✅

**Mark Complete:** Click the checkbox icon on any task row to toggle completion.

**Overdue Tasks:** Tasks with a past due date appear highlighted in red.
The Dashboard shows overdue count in the Priorities grid.
`,
      },
      {
        title: 'Task Filters & Views',
        content: `
On the Tasks page, use the filter tabs:
- **All** — Every task
- **My Tasks** — Tasks assigned to you
- **Overdue** — Past due date, not completed
- **Today** — Due today
- **Upcoming** — Due in the next 7 days
- **Completed** — Done tasks

**Search:** Type to find tasks by title.

**Priority colors:** High (red), Medium (yellow), Low (gray).

Tasks with deal linkage show the linked deal name — click to jump directly to that deal.
`,
      },
    ],
  },
  {
    id: 'sequences',
    icon: Zap,
    color: '#d97706',
    title: '⚡ Sequences',
    description: 'Automated email & outreach sequences',
    articles: [
      {
        title: 'What are Sequences?',
        content: `
**Sequences** are automated multi-step outreach campaigns. Build a sequence once — enroll leads — let Huntlo execute each touchpoint automatically.

**Common Sequence Types:**
- Cold outreach (Day 1 email → Day 3 LinkedIn → Day 7 follow-up)
- Demo follow-up (Thank you email → Summary → Proposal email)
- Trial nurture (Onboarding email → Tips → Check-in → Trial end push)

**Sequence Steps can be:**
- 📧 Email (personalized with merge tags)
- 🔗 LinkedIn (action reminder for SDR)
- ⏳ Wait (delay between steps)
`,
      },
      {
        title: 'Creating a Sequence',
        content: `
1. Go to **Sequences** in the sidebar
2. Click **"New Sequence"**
3. Add a name (e.g. "Cold Outreach — Recruitment Agencies")
4. Add steps using the visual builder:
   - Click "+ Add Step"
   - Choose type: Email, LinkedIn, Wait
   - For Email steps: add Subject + Body with merge tags
5. **Personalization merge tags:**
   - \`{{first_name}}\` — Contact's first name
   - \`{{company_name}}\` — Company name
   - \`{{your_name}}\` — Your name (from profile)
   - \`{{your_title}}\` — Your job title

6. Click **Save Sequence**

**Email sending requires:** SMTP configured in Settings → Integrations → Email Settings, OR Google Workspace connected.
`,
      },
      {
        title: 'Enrolling Leads in a Sequence',
        content: `
**From Leads Page:**
1. Select leads using checkboxes (multi-select)
2. Click **"Enroll in Sequence"** in the bulk action bar
3. Choose your sequence → Click Enroll
4. Day 1 email sends immediately to all enrolled leads with valid email addresses

**From Contacts Page:**
Same process — select contacts → Enroll in Sequence.

**Sequence execution:**
- Day 1 email fires immediately on enrollment
- Subsequent steps require a backend cron job (configured in Supabase if set up)

💡 **Note:** Always test your sequence by enrolling your own email first before sending to real leads.
`,
      },
    ],
  },
  {
    id: 'proposals',
    icon: FileText,
    color: '#0891b2',
    title: '📋 Proposals',
    description: 'Proposal creation and tracking',
    articles: [
      {
        title: 'Creating a Proposal',
        content: `
Proposals live inside Deals. Open any Deal → Click the **"Proposals"** tab.

**Steps:**
1. Click **"New Proposal"**
2. Add a **Title** (e.g. "Q3 Growth Package")
3. Set **Status** (Draft / Sent / Viewed / Accepted / Rejected / Expired)
4. Set **Validity** (default 30 days)
5. Add **Line Items** — each with a description and amount:
   - e.g. "Platform License — ₹24,999/mo"
   - e.g. "Onboarding & Setup — ₹5,000"
6. Total auto-calculates from all line items
7. Add **Notes / Terms** (payment terms, conditions, etc.)
8. Click **"Save Proposal"**

The proposal appears in the list with its status badge.
`,
      },
      {
        title: 'Managing Proposal Status',
        content: `
For each proposal card, you can:

- **Change Status** — Use the status dropdown (Draft → Sent → Viewed → Accepted etc.)
- **Edit** — Reopen the form to update any field
- **Copy Link** — Generates a shareable URL for the proposal (future feature)
- **Delete** — Remove the proposal permanently

**Status meanings:**
| Status | Meaning |
|--------|---------|
| **Draft** | Being prepared, not yet sent |
| **Sent** | Proposal emailed/shared with prospect |
| **Viewed** | Prospect has opened the proposal |
| **Accepted** ✅ | Prospect agreed — move deal to Closed Won |
| **Rejected** ❌ | Prospect declined — review and adjust |
| **Expired** | Validity period passed — follow up |

**Dashboard Proposals stat:** "Proposals Out" shows total sent (non-draft) across ALL your deals, with accepted count and total won value.
`,
      },
    ],
  },
  {
    id: 'documents',
    icon: FileText,
    color: '#64748b',
    title: '📄 Documents',
    description: 'Document and resource library',
    articles: [
      {
        title: 'Adding Documents',
        content: `
The **Documents** page is a shared resource library for your whole team.

**Add a Document:**
1. Documents → Click **"Add Document"**
2. Fill in:
   - **Name** — Descriptive name (e.g. "Huntlo Sales Deck Q3 2026")
   - **Type** — Proposal, Contract, Deck, Playbook, Case Study, Other
   - **URL** — Link to the document (Google Drive, Notion, Dropbox, etc.)
   - **Notes** — Brief description

3. Click **Save**

**Team Notification:**
When you add a document, all other team members receive an email notification with the document link.

**Use cases:**
- Sales decks to share with prospects
- Contract templates
- Competitor battlecards
- Onboarding playbooks
- Customer case studies
`,
      },
    ],
  },
  {
    id: 'reports',
    icon: TrendingUp,
    color: '#16a34a',
    title: '📈 Reports',
    description: 'Analytics, forecasts, and AI insights',
    articles: [
      {
        title: 'Reports Overview',
        content: `
The **Reports** page gives you deep analytics across your entire pipeline.

**Available Reports:**

**Pipeline Summary**
- Total deals per stage
- MRR breakdown by stage
- Win/Loss ratio
- Average deal size

**Lead Analytics**
- Leads by stage distribution
- Signal score distribution
- Conversion rates by stage
- Source breakdown (if source is tracked)

**Team Performance** (if team members exist)
- Deals per owner
- Win rate per rep
- Task completion rate

**Activity Timeline**
- Deal velocity (time spent per stage)
- Activity heatmap

**AI Forecast:**
Click "Generate AI Forecast" to get a Gemini-powered pipeline prediction based on your current deal velocity and historical patterns.

💡 All reports update in real-time as you add and move deals/leads.
`,
      },
    ],
  },
  {
    id: 'integrations',
    icon: Link2,
    color: '#3b82f6',
    title: '🔗 Integrations & Settings',
    description: 'Connect your tools and configure the system',
    articles: [
      {
        title: 'Google Workspace (Calendar + Gmail)',
        content: `
**Go to:** Settings → Integrations → Google Workspace

**What it enables:**
- Auto-create Google Calendar events when scheduling meetings in Huntlo
- Auto-generate Google Meet links
- Send sequence emails via Gmail (not SMTP)

**How to connect:**
1. Click **"Connect Google Workspace"**
2. Sign in with your corporate Google account
3. Grant Calendar and Gmail permissions
4. You're connected — green badge appears

**Once connected:**
- Every meeting you schedule in Huntlo creates a Calendar event
- Meet link is automatically inserted in the meeting record
- Primary contact from the linked deal is invited automatically

**Sync existing calendar:**
Click **"Sync Calendar"** to pull in upcoming meetings from Google Calendar into Huntlo.
`,
      },
      {
        title: 'Email Settings (SMTP)',
        content: `
**Go to:** Settings → Integrations → Email Settings

Configure your outgoing email for sequence sending:

| Field | Example |
|-------|---------|
| SMTP Host | smtp.gmail.com |
| SMTP Port | 587 |
| SMTP User | yourname@company.com |
| SMTP Password | your-app-password |
| Sender Name | Your Name |
| Reply-to Email | yourname@company.com |

**Gmail App Password:**
If using Gmail, go to Google Account → Security → App Passwords → Generate one for "Mail".

**Test it:** After saving, enroll yourself in a sequence to test that emails send correctly.
`,
      },
      {
        title: 'Gemini AI Key',
        content: `
**Go to:** Settings → Integrations → Google Gemini AI

**What it powers:**
- AI follow-up email drafting (Deal drawer → Overview tab)
- AI company insights (Deal drawer → AI Insights tab)
- Dashboard AI question answering
- Pipeline forecast generation

**How to get a key:**
1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" → Create API Key
4. Copy the key → Paste it in Settings → Save Key

**Without a key:** Huntlo runs in Demo Mode — AI features show placeholder responses.
`,
      },
      {
        title: 'Webhook Integration',
        content: `
**Go to:** Settings → Integrations → Webhook Settings

Huntlo can receive leads from external tools via webhook.

**Use cases:**
- Receive leads from your website contact form
- Sync leads from LinkedIn lead gen forms
- Get notified from Zapier/Make when a new prospect shows interest

**Setup:**
1. Copy your **Webhook URL** from the settings
2. Copy your **Secret Token** (used to verify the webhook source)
3. Configure your external tool to POST to this URL with lead data in JSON format

**Lead data format:**
\`\`\`json
{
  "company_name": "Acme Corp",
  "contact_name": "Jane Doe",
  "email": "jane@acme.com",
  "phone": "+91 98765 43210",
  "source": "Website"
}
\`\`\`

Incoming webhook leads are automatically tagged as source "Webhook" and appear in your Leads list immediately.
`,
      },
      {
        title: 'Team Management',
        content: `
**Go to:** Settings → Team & Workspace

**Invite a team member:**
1. Enter their email address
2. Choose their role: Admin or Member
3. Click "Send Invite"
4. They receive an email with a signup link

**Roles:**
- **Admin** — Full access: can edit any lead/deal, invite/remove members
- **Member** — Can view all, but can only edit their own leads/deals

**Team visibility:**
All team members can see all leads, deals, meetings, and tasks — full transparency. This ensures no lead falls through the cracks when a rep is absent.

**Owner assignment:**
Each lead and deal has an Owner. The Owner dropdown on every lead row lets you reassign ownership instantly.
`,
      },
    ],
  },
  {
    id: 'ai',
    icon: Sparkles,
    color: '#8b5cf6',
    title: '🤖 AI Features',
    description: 'Gemini-powered sales intelligence',
    articles: [
      {
        title: 'AI Follow-up Email Drafting',
        content: `
**Location:** Pipeline → Open any Deal → Overview tab → "Draft Follow-up" button

Huntlo uses Google Gemini to write a personalized follow-up email based on:
- The company name
- The deal stage
- The last activity date
- The primary contact

**The draft appears in the AI Generated box** — copy it, personalize if needed, then send via your email client or sequence.

**Requirements:** Gemini API key configured in Settings → Integrations.
`,
      },
      {
        title: 'AI Deal Insights',
        content: `
**Location:** Pipeline → Open any Deal → "AI Insights" tab → "Generate AI Insights"

Get tactical recommendations for a specific deal:
- Potential objections and how to address them
- Competitive positioning tips
- Recommended next steps based on stage
- Industry-specific talking points

**Customization:** The AI uses the deal's company name, industry, engagement score, and stage to tailor recommendations.
`,
      },
      {
        title: 'Dashboard AI Question Answering',
        content: `
**Location:** Dashboard → AI Sales Intelligence section

Ask any question about your pipeline in plain English:

**Example questions:**
- "Which deals are at risk of going stale?"
- "Write a cold email for a recruitment agency in London"
- "What's my expected revenue this month?"
- "Which leads should I prioritize this week?"
- "Summarize the current state of my pipeline"

The AI has context on your pipeline MRR, deal stages, hot leads, overdue tasks, and upcoming meetings.
`,
      },
    ],
  },
  {
    id: 'csv',
    icon: Layers,
    color: '#0891b2',
    title: '📥 CSV Import / Export',
    description: 'Bulk data import and export',
    articles: [
      {
        title: 'Importing Leads via CSV',
        content: `
**Go to:** Leads page → Click **"Import CSV"** button

**Expected CSV columns:**
\`company_name, contact_name, email, phone, website, industry, stage, notes\`

**Sample CSV:**
\`\`\`
company_name,contact_name,email,phone,website,industry,stage
Acme Recruiting,Jane Doe,jane@acme.com,+44 7700 900000,acme.com,Recruitment,New Lead
TalentFirst Ltd,John Smith,john@talentfirst.com,+91 98765 43210,talentfirst.com,Staffing,Researching
\`\`\`

**What happens on import:**
1. Huntlo previews your CSV and maps columns
2. You can adjust column mapping if headers differ
3. Duplicates (same email + org) are skipped automatically
4. All leads appear in your Leads list immediately

**Importing Contacts:**
Contacts page → Import CSV. Huntlo auto-creates Companies if they don't exist.

**Importing Companies:**
Companies page → Import CSV.
`,
      },
      {
        title: 'Exporting Data',
        content: `
All major list pages have an **Export** button:

- **Leads** → Exports all filtered leads to CSV
- **Contacts** → Exports all filtered contacts to CSV
- **Companies** → Exports all filtered companies to CSV

**Export respects your current filters:**
If you're viewing "Hot Leads" with a stage filter applied, only those leads are exported.

**CSV format:** Standard comma-separated, UTF-8 encoded — opens in Excel, Google Sheets, etc.

**Fields exported:** All visible columns plus IDs and timestamps.
`,
      },
    ],
  },
  {
    id: 'webinars',
    icon: Video,
    color: '#ec4899',
    title: '🎥 Webinars',
    description: 'Manage webinar events and registrants',
    articles: [
      {
        title: 'Webinars & Luma / Google Sheets Integration',
        content: `
If you primarily use **Luma** for webinar registrations and **Google Sheets** for managing the initial lists, Huntlo acts as your central Hub for tracking the downstream sales funnel.

**Workflow:**
1. **Host on Luma:** Use Luma for your event landing page and registrations.
2. **Export / Sync:** Export your Luma registrants to a CSV or Google Sheet.
3. **Import to Huntlo:** Go to the **Leads** or **Contacts** page in Huntlo and click **Import CSV**. Huntlo will automatically create Contact and Company records for your registrants.
4. **Manage the Webinar:** Go to the **Webinars** page to track the event lifecycle (Planned → In Promotion → Live → Follow-up → Closed).
`,
      },
      {
        title: 'Webinar Dashboard & KPIs',
        content: `
The **Webinars** page offers two views:

**1. 90-Day Roadmap (Kanban):**
A board showing all your webinars across their lifecycle:
- **Planned:** Event is scheduled but not yet public
- **In Promotion:** Actively marketing and driving registrations
- **Live:** The event is happening today/soon
- **Follow-up:** Event is over, SDRs are doing outreach
- **Closed:** All follow-up actions complete

**2. KPI Dashboard:**
Tracks your webinar funnel health:
- **Total Registrations:** Across all events
- **Attendance Rate:** Percentage of registrants who actually showed up
- **Demo Request Rate:** Percentage of attendees who requested a demo
- **Pipeline Generated:** Total ARR from deals sourced via webinars
`,
      },
      {
        title: 'Managing Registrants & Tasks',
        content: `
Click on any Webinar card to open the **Webinar Detail** view.

**Registrants Tab:**
- Shows all contacts registered for this specific webinar
- Displays their **Lead Score** (e.g., auto-calculated based on their profile/activity)
- **Attendance Tracking:** Mark if they attended
- **Demo Requests:** If a registrant requests a demo, click the **Mark as Requested** button. Huntlo will automatically create a new Deal in your pipeline for this contact!

**Tasks Tab:**
- Track webinar-specific tasks (e.g., "Send reminder email", "Upload recording")
- Overdue tasks will highlight the webinar card in red on the main dashboard to ensure nothing is missed.
`,
      },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────
function ArticleCard({ article, isOpen, onToggle }) {
  return (
    <div className="ug-article">
      <button className="ug-article-header" onClick={onToggle}>
        <ChevronRight size={15} className={`ug-article-chevron ${isOpen ? 'open' : ''}`} />
        <span className="ug-article-title">{article.title}</span>
      </button>
      {isOpen && (
        <div className="ug-article-body">
          <MarkdownContent content={article.content} />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content }) {
  // Simple markdown renderer for bold, tables, code, lists
  const lines = content.trim().split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      // Code block
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="ug-code-block">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.startsWith('| ')) {
      // Table
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(r => !r.match(/^\|[-| ]+\|$/));
      elements.push(
        <div key={i} className="ug-table-wrap">
          <table className="ug-table">
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split('|').filter(c => c.trim() !== '');
                return (
                  <tr key={ri} className={ri === 0 ? 'ug-table-head-row' : ''}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="ug-table-cell">
                        <InlineMarkdown text={cell.trim()} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.match(/^\d+\. /) || line.startsWith('- ') || line.startsWith('* ')) {
      // List
      const listItems = [];
      const isOrdered = line.match(/^\d+\. /);
      while (i < lines.length && (lines[i].match(/^\d+\. /) || lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        const text = lines[i].replace(/^(\d+\. |- |\* )/, '');
        listItems.push(text);
        i++;
      }
      const Tag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <Tag key={i} className="ug-list">
          {listItems.map((item, li) => (
            <li key={li}><InlineMarkdown text={item} /></li>
          ))}
        </Tag>
      );
      continue;
    } else if (line === '') {
      elements.push(<div key={i} className="ug-spacer" />);
    } else {
      elements.push(
        <p key={i} className="ug-para">
          <InlineMarkdown text={line} />
        </p>
      );
    }
    i++;
  }

  return <div className="ug-content">{elements}</div>;
}

function InlineMarkdown({ text }) {
  // Handle **bold** and `inline code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="ug-inline-code">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SectionCard({ section, isActive, onClick }) {
  const Icon = section.icon;
  return (
    <button
      className={`ug-section-btn ${isActive ? 'active' : ''}`}
      style={{ '--section-color': section.color }}
      onClick={onClick}
    >
      <div className="ug-section-icon" style={{ background: section.color + '20', color: section.color }}>
        <Icon size={18} />
      </div>
      <div className="ug-section-info">
        <span className="ug-section-title">{section.title}</span>
        <span className="ug-section-desc">{section.description}</span>
      </div>
      {section.badge && <span className="ug-section-badge">{section.badge}</span>}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function UserGuide() {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [openArticles, setOpenArticles] = useState({ 0: true }); // open first article by default
  const [search, setSearch] = useState('');

  const section = GUIDE_SECTIONS.find(s => s.id === activeSection);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results = [];
    GUIDE_SECTIONS.forEach(sec => {
      sec.articles.forEach(article => {
        if (
          article.title.toLowerCase().includes(q) ||
          article.content.toLowerCase().includes(q)
        ) {
          results.push({ section: sec, article });
        }
      });
    });
    return results;
  }, [search]);

  const toggleArticle = (idx) => {
    setOpenArticles(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSectionChange = (id) => {
    setActiveSection(id);
    setOpenArticles({ 0: true });
    setSearch('');
  };

  return (
    <div className="user-guide-wrap">
      {/* Header */}
      <div className="ug-header">
        <div className="ug-header-left">
          <div className="ug-header-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="ug-header-title">Huntlo User Guide</h2>
            <p className="ug-header-sub">Complete documentation for the world-class Huntlo Sales CRM</p>
          </div>
        </div>
        <div className="ug-search-wrap">
          <Search size={14} className="ug-search-icon" />
          <input
            className="ug-search-input"
            placeholder="Search documentation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Version badge */}
      <div className="ug-version-bar">
        <span className="ug-version-badge">v2.0 — June 2026</span>
        <span className="ug-version-text">Includes: Auto-Link, Convert Lead→Deal, Smart Deal Form, Real Contacts in Deals, Functional Tasks, Dashboard Proposals</span>
      </div>

      {/* Search Results */}
      {searchResults !== null && (
        <div className="ug-search-results">
          <div className="ug-search-results-title">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"
          </div>
          {searchResults.length === 0 ? (
            <div className="ug-no-results">
              <Search size={28} style={{ opacity: 0.3 }} />
              <p>No articles found. Try different keywords.</p>
            </div>
          ) : (
            searchResults.map((r, i) => (
              <div key={i} className="ug-search-result-item" onClick={() => {
                setActiveSection(r.section.id);
                setSearch('');
                // Find article index and open it
                const idx = r.section.articles.indexOf(r.article);
                setOpenArticles({ [idx]: true });
              }}>
                <div className="ug-sr-icon" style={{ background: r.section.color + '20', color: r.section.color }}>
                  <r.section.icon size={13} />
                </div>
                <div>
                  <div className="ug-sr-title">{r.article.title}</div>
                  <div className="ug-sr-section">{r.section.title}</div>
                </div>
                <ArrowRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Layout */}
      {!searchResults && (
        <div className="ug-layout">
          {/* Sidebar */}
          <div className="ug-sidebar">
            <div className="ug-sidebar-label">Sections</div>
            {GUIDE_SECTIONS.map(sec => (
              <SectionCard
                key={sec.id}
                section={sec}
                isActive={activeSection === sec.id}
                onClick={() => handleSectionChange(sec.id)}
              />
            ))}
          </div>

          {/* Content */}
          <div className="ug-main">
            {section && (
              <>
                <div className="ug-section-header">
                  <div className="ug-sh-icon" style={{ background: section.color + '20', color: section.color }}>
                    <section.icon size={22} />
                  </div>
                  <div>
                    <h2 className="ug-sh-title">{section.title}</h2>
                    <p className="ug-sh-desc">{section.description} · {section.articles.length} article{section.articles.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="ug-articles-list">
                  {section.articles.map((article, idx) => (
                    <ArticleCard
                      key={idx}
                      article={article}
                      isOpen={!!openArticles[idx]}
                      onToggle={() => toggleArticle(idx)}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="ug-nav-footer">
                  {GUIDE_SECTIONS.findIndex(s => s.id === activeSection) > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const idx = GUIDE_SECTIONS.findIndex(s => s.id === activeSection);
                        handleSectionChange(GUIDE_SECTIONS[idx - 1].id);
                      }}
                    >
                      ← Prev
                    </button>
                  )}
                  <span className="ug-nav-pos">
                    {GUIDE_SECTIONS.findIndex(s => s.id === activeSection) + 1} / {GUIDE_SECTIONS.length}
                  </span>
                  {GUIDE_SECTIONS.findIndex(s => s.id === activeSection) < GUIDE_SECTIONS.length - 1 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const idx = GUIDE_SECTIONS.findIndex(s => s.id === activeSection);
                        handleSectionChange(GUIDE_SECTIONS[idx + 1].id);
                      }}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
