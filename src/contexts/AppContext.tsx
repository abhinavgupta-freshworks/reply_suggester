import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  id: string;
  from: 'customer' | 'agent';
  text: string;
  ts: string;
  sentiment: 'happy' | 'neutral' | 'sad' | 'angry';
  language: string;
}

export interface Customer {
  name: string;
  email: string;
  language: string;
}

export interface Ticket {
  id: string;
  subject: string;
  customer: Customer;
  status: 'open' | 'pending' | 'closed';
  assignedTo: string;
  messages: Message[];
  kb_refs: string[];
  created_at: string;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  text: string;
}

export interface Agent {
  id: string;
  name: string;
}

export interface TelemetryEvent {
  event: string;
  [key: string]: any;
}

export interface BrandVoice {
  enabled: boolean;
  archetype: string;
  custom_lexicon: string[];
  sample_rules: string;
  company_name: string;
  industry: string;
  formality: string;
  emoji_usage: string;
  learning_example_replies: string;
  learning_urls: string;
  learning_ticket_ids: string;
  custom_lexicon_text: string;
  response_archetypes_text: string;
  my_style_enabled: boolean;
  auto_learn_enabled: boolean;
  selected_agent_id: string;
  style_test_input: string;
  style_test_output: string;
  guidelines_dos: string[];
  guidelines_donts: string[];
}

export interface VerifierRules {
  block_inappropriate_language: boolean;
  detect_pii: boolean;
  detect_internal_links: boolean;
  brand_voice_adherence: boolean;
  repetitive_solution_check: boolean;
  required_phrases: string[];
  blocked_keywords: string[];
  verifier_timing: 'before_send' | 'after_send';
}

export interface AdminConfig {
  features: {
    write_with_ai: boolean;
    summarize: boolean;
    sentiment: boolean;
    live_translate: boolean;
    reply_suggester: boolean;
    reply_verifier: boolean;
  };
  reply_suggester_sources: {
    solution_articles: boolean;
    similar_tickets: boolean;
    canned_responses: boolean;
    tickets: boolean;
  };
  brand_voice: BrandVoice;
  verifier_rules: VerifierRules;
}

interface AppState {
  tickets: Ticket[];
  kb_articles: KBArticle[];
  canned_responses: CannedResponse[];
  agents: Agent[];
  telemetry: {
    events: TelemetryEvent[];
  };
  admin_config: AdminConfig;
  activeTicket: Ticket | null;
  liveSuggestion: string;
  contextPanelVisible: boolean;
  filters: {
    status: string;
    sentiment: string;
    assigned: string;
  };
}

interface AppContextType {
  state: AppState;
  setActiveTicket: (ticket: Ticket | null) => void;
  setLiveSuggestion: (suggestion: string) => void;
  setContextPanelVisible: (visible: boolean) => void;
  addTelemetryEvent: (event: TelemetryEvent) => void;
  updateAdminConfig: (config: Partial<AdminConfig>) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  addMessage: (ticketId: string, message: Message) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

const initialState: AppState = {
  tickets: [
    {
      id: 'T-1001',
      subject: 'Cannot login to app',
      customer: { name: 'Asha Patel', email: 'asha@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm1', from: 'customer', text: 'I cannot login since yesterday.', ts: '2025-10-20T09:00:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm2', from: 'agent', text: 'Hi Asha — can you tell me the error?', ts: '2025-10-20T09:05:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: ['KB-101'],
      created_at: '2025-10-20T09:00:00Z'
    },
    {
      id: 'T-1002',
      subject: 'Refund status',
      customer: { name: 'John Lee', email: 'john@example.com', language: 'en' },
      status: 'pending',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm3', from: 'customer', text: 'When will I get my refund?', ts: '2025-10-19T14:00:00Z', sentiment: 'sad', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-19T14:00:00Z'
    },
    {
      id: 'T-1003',
      subject: 'Feature request: dark mode',
      customer: { name: 'Maria Gomez', email: 'maria@example.com', language: 'es' },
      status: 'open',
      assignedTo: '',
      messages: [
        { id: 'm4', from: 'customer', text: 'Sería genial tener modo oscuro.', ts: '2025-10-18T10:00:00Z', sentiment: 'neutral', language: 'es' }
      ],
      kb_refs: [],
      created_at: '2025-10-18T10:00:00Z'
    },
    {
      id: 'T-1004',
      subject: 'Clarify missing details for intermittent login error',
      customer: { name: 'Customer User', email: 'customer@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm5', from: 'customer', text: 'Hi — I suddenly get \'Something went wrong\' when I try to log in. It happened twice today.', ts: '2025-10-20T09:12:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm6', from: 'agent', text: 'Thanks for reporting this — sorry for the inconvenience. Can you tell me: (1) which device/browser you used, (2) the exact time (approx) it happened, and (3) whether you see any error code? That will help us reproduce the issue.', ts: '2025-10-20T09:14:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm7', from: 'customer', text: 'I was on my laptop (Windows) using Chrome. First was around 8:10am, second around 8:45am. No error code, just the message.', ts: '2025-10-20T09:16:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm8', from: 'agent', text: 'Got it — thanks. Can you confirm if you were on the company network or a public Wi-Fi? Also, does the issue happen after entering credentials or earlier?', ts: '2025-10-20T09:18:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm9', from: 'customer', text: 'I was at home on my ISP. It happens after I click Sign In — page refreshes then shows \'Something went wrong.\'', ts: '2025-10-20T09:20:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm10', from: 'agent', text: 'Thanks — that\'s helpful. I\'ll escalate with logs and ask our Auth team to look at the 8:10–8:50 window. Meanwhile, please try an incognito window and let me know if it reproduces. I\'ll follow up here within 2 business hours.', ts: '2025-10-20T09:22:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: ['KB-101'],
      created_at: '2025-10-20T09:12:00Z'
    },
    {
      id: 'T-1005',
      subject: 'Password reset — standard KB flow (paraphrased mode)',
      customer: { name: 'Chat User', email: 'chatuser@example.com', language: 'en' },
      status: 'closed',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm11', from: 'customer', text: 'I forgot my password — can you reset it?', ts: '2025-10-19T11:00:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm12', from: 'agent', text: 'I can help with that. I\'ll send a password reset link to your registered email — please click it and follow the steps. If you don\'t see the email, check spam.', ts: '2025-10-19T11:01:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm13', from: 'customer', text: 'I didn\'t get any email yet.', ts: '2025-10-19T11:03:00Z', sentiment: 'sad', language: 'en' },
        { id: 'm14', from: 'agent', text: 'Thanks for checking. I resent the password reset link just now. Please also verify the email address on file and check spam/promotions. If the link expires, reply here and I\'ll create a one-time code.', ts: '2025-10-19T11:04:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm15', from: 'customer', text: 'Got it and reset — working now, thanks.', ts: '2025-10-19T11:07:00Z', sentiment: 'happy', language: 'en' },
        { id: 'm16', from: 'agent', text: 'Great — glad it\'s resolved. If anything else comes up, reply to this thread.', ts: '2025-10-19T11:08:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: ['KB-101'],
      created_at: '2025-10-19T11:00:00Z'
    },
    {
      id: 'T-1006',
      subject: 'Multiple issues in one message — billing, access, and export',
      customer: { name: 'SMB Admin', email: 'admin@smb.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm17', from: 'customer', text: 'We were billed twice this month, one user lost access after I changed their role, and I need a CSV export of last quarter — can you help with all three?', ts: '2025-10-18T08:30:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm18', from: 'agent', text: 'Thanks for listing everything — I\'ll address each item below and outline next steps for each issue.', ts: '2025-10-18T08:35:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm19', from: 'agent', text: 'Billing (Duplicate charge): I see two charges for invoice #INV-2025-09 in our billing system. I will initiate a review and, if confirmed, process a refund within 3–5 business days. Please confirm the invoice number if different.', ts: '2025-10-18T08:35:30Z', sentiment: 'neutral', language: 'en' },
        { id: 'm20', from: 'agent', text: 'Access (Role change): For the user who lost access, please provide the user email. Typically a role change requires re-provisioning; I will step through the role sync and confirm access within 1 business hour after we receive the user identifier.', ts: '2025-10-18T08:36:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm21', from: 'agent', text: 'Export (CSV): We can provide a CSV of last quarter\'s data. I\'ll prepare a secure export and share a download link (valid 48 hours) after the billing review completes to avoid mixing with any accounting adjustments. Do you want all columns or a filtered export (e.g., transactions only)?', ts: '2025-10-18T08:36:30Z', sentiment: 'neutral', language: 'en' },
        { id: 'm22', from: 'customer', text: 'Thanks — invoice is INV-2025-09; user email is user@example.com; please include all columns.', ts: '2025-10-18T08:40:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm23', from: 'agent', text: 'Understood — I will (1) start a billing review for INV-2025-09, (2) re-provision access for user@example.com and confirm, and (3) prepare a full export and share a secure link after billing completes. I\'ll update this thread with progress on each item.', ts: '2025-10-18T08:42:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-18T08:30:00Z'
    },
    {
      id: 'T-1007',
      subject: 'Cite KB and similar tickets for suggested config change',
      customer: { name: 'IT Admin', email: 'itadmin@company.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm24', from: 'customer', text: 'We want to change the webhook retry interval — will that affect delivery?', ts: '2025-10-17T13:00:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm25', from: 'agent', text: 'Short answer: usually safe if increased within supported bounds. I\'ll reference the relevant KB and a prior ticket where we applied this change for a similar app.', ts: '2025-10-17T13:02:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm26', from: 'agent', text: 'Source A: Webhook delivery and retry policy (recommends intervals 30–300s). Source B: Similar ticket TCK-3098 (same integration) showed no delivery loss after updating to 60s. Proposed change: set to 60s and monitor for 48 hours.', ts: '2025-10-17T13:02:30Z', sentiment: 'neutral', language: 'en' },
        { id: 'm27', from: 'customer', text: 'Okay — let\'s try 60s. How will you monitor and report back?', ts: '2025-10-17T13:05:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm28', from: 'agent', text: 'I will apply the change during a maintenance window and enable delivery metrics for 48 hours. I\'ll share a report comparing delivery success rate pre/post. Confidence: data_quality=0.88 (KB + similar ticket), reply_quality=0.86.', ts: '2025-10-17T13:06:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm29', from: 'customer', text: 'Thanks — proceed.', ts: '2025-10-17T13:07:00Z', sentiment: 'happy', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-17T13:00:00Z'
    },
    {
      id: 'T-1008',
      subject: 'Password change succeeded — customer immediately asks to reset',
      customer: { name: 'End User', email: 'enduser@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm30', from: 'customer', text: 'I changed my password and it\'s working — thanks!', ts: '2025-10-16T16:00:00Z', sentiment: 'happy', language: 'en' },
        { id: 'm31', from: 'agent', text: 'Great — glad to hear that. If you need anything else, I\'m here.', ts: '2025-10-16T16:01:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm32', from: 'customer', text: 'Actually — can you help me reset my other account\'s password?', ts: '2025-10-16T16:02:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm33', from: 'agent', text: 'Sure — I can help with a password reset for the other account. Before I proceed, please confirm the email associated with that account (or we can send a reset link to the registered address).', ts: '2025-10-16T16:03:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm34', from: 'customer', text: 'It\'s altuser@example.com — please send the reset.', ts: '2025-10-16T16:04:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm35', from: 'agent', text: 'Thanks — I\'ll send the password reset link to altuser@example.com now. Please click the link and follow the steps; it will expire in 24 hours.', ts: '2025-10-16T16:05:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: ['KB-101'],
      created_at: '2025-10-16T16:00:00Z'
    },
    {
      id: 'T-1009',
      subject: 'Earlier ticket unresolved — customer silent then returns with different issue',
      customer: { name: 'Silent User', email: 'silent@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm36', from: 'customer', text: 'I reported that I wasn\'t getting email notifications last week — any update?', ts: '2025-10-10T09:00:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm37', from: 'agent', text: 'We investigated and requested logs from your mail provider; we were waiting for their reply. Did you still experience missing notifications after Tuesday?', ts: '2025-10-10T09:10:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm38', from: 'customer', text: 'Now that it\'s sorted, quick question — can we schedule weekly summary emails to the team?', ts: '2025-10-16T10:15:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm39', from: 'agent', text: 'Glad to hear the notifications are sorted. For scheduling weekly summaries, we offer a scheduled report feature — would you like it sent to the same distribution or a different list?', ts: '2025-10-16T10:18:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm40', from: 'customer', text: 'Same distribution is fine — go ahead.', ts: '2025-10-16T10:20:00Z', sentiment: 'happy', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-10T09:00:00Z'
    },
    {
      id: 'T-1010',
      subject: 'Customer unsatisfied — agent offers escalation and alternatives',
      customer: { name: 'Finance Approver', email: 'finance@company.com', language: 'en' },
      status: 'pending',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm41', from: 'customer', text: 'The refund offered is only partial — this doesn\'t cover our fees. I\'m not happy with that outcome.', ts: '2025-10-15T14:00:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm42', from: 'agent', text: 'I\'m sorry this hasn\'t met expectations — I understand the impact. We offered the standard policy refund; let me propose alternatives and escalate if needed.', ts: '2025-10-15T14:02:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm43', from: 'agent', text: 'Alternatives: (A) Issue an adjusted goodwill credit for the remaining fees subject to manager approval, (B) Escalate to Billing Ops for manual review (2–3 business days). Which option would you prefer?', ts: '2025-10-15T14:03:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm44', from: 'customer', text: 'Please escalate — I want operations to review and get back with a final decision.', ts: '2025-10-15T14:05:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm45', from: 'agent', text: 'Understood — I will escalate to Billing Ops now and include your notes. Expect an update in 2–3 business days. I will also include a request for expedited review given your account status.', ts: '2025-10-15T14:06:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm46', from: 'agent', text: 'If you\'d like, I can also prepare a one-page summary of the case to speed the ops review — shall I add that?', ts: '2025-10-15T14:07:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-15T14:00:00Z'
    },
    {
      id: 'T-1011',
      subject: 'Repeated issue — same troubleshooting steps already tried',
      customer: { name: 'Sync User', email: 'syncuser@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm47', from: 'customer', text: 'Files still not syncing between desktop and web. I already restarted the app and cleared cache as you suggested.', ts: '2025-10-14T09:00:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm48', from: 'agent', text: 'Thanks for confirming the steps you tried. Since restart and cache clear didn\'t resolve it, we\'ll move to network and account diagnostics next.', ts: '2025-10-14T09:03:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm49', from: 'agent', text: 'Please run these checks: (1) confirm desktop app shows \'Connected\' (Help → Diagnostics), (2) verify internet MTU is standard (1500), (3) sign out and sign back in on web while keeping desktop running. Share results.', ts: '2025-10-14T09:04:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm50', from: 'customer', text: 'Diagnostics shows \'Connected\'. MTU check returns 1500. I signed out from web and signed in again but still no sync.', ts: '2025-10-14T09:10:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm51', from: 'agent', text: 'Thanks — since desktop shows connected and MTU is normal, I\'ll collect client logs and escalate to Sync Engineering for deeper analysis. I\'ll request a targeted sync test and keep you updated.', ts: '2025-10-14T09:12:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm52', from: 'agent', text: 'For tracking: previously tried steps = restart app, clear cache. New actions = network checks, sign-out/sign-in, log collection and escalation.', ts: '2025-10-14T09:13:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-14T09:00:00Z'
    },
    {
      id: 'T-1012',
      subject: 'Fresh issue — extract intent from latest message while respecting prior constraints',
      customer: { name: 'Project Manager', email: 'pm@company.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm53', from: 'customer', text: 'Previously you told me we couldn\'t send more than 200 emails per hour. Now I need 500 for a campaign — can we bump that?', ts: '2025-10-12T09:00:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm54', from: 'agent', text: 'Historically we advised a 200/hr soft limit for shared plans; to increase to 500/hr we need to check plan allowances.', ts: '2025-10-12T09:02:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm55', from: 'customer', text: 'We\'re on Team plan. I need the increase for a 2-hour campaign tomorrow morning.', ts: '2025-10-12T09:05:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm56', from: 'agent', text: 'Thanks — since you are on Team plan, we can request a temporary quota increase for the 2-hour window. I will submit a request to Ops and advise if approval is required.', ts: '2025-10-12T09:07:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm57', from: 'customer', text: 'Please do — it\'s critical to go live tomorrow at 09:00.', ts: '2025-10-12T09:08:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm58', from: 'agent', text: 'Understood — I\'ll flag this as time-sensitive and include the campaign window in the Ops request. I\'ll update you within 4 hours.', ts: '2025-10-12T09:10:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-12T09:00:00Z'
    },
    {
      id: 'T-1013',
      subject: 'Known resolution — guide step-by-step until success',
      customer: { name: '2FA User', email: '2fauser@example.com', language: 'en' },
      status: 'closed',
      assignedTo: 'agent_1',
      messages: [
        { id: 'm59', from: 'customer', text: 'I want to enable 2FA but I\'m not sure the steps.', ts: '2025-10-11T10:00:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm60', from: 'agent', text: 'I\'ll guide you step-by-step. After each step, tell me \'done\' and I\'ll provide the next checkpoint.', ts: '2025-10-11T10:01:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm61', from: 'agent', text: 'Step 1: Go to Settings > Security > Two-factor authentication. Click \'Enable 2FA\'. (Expected outcome: you\'ll see a QR code and an option to enter code from authenticator app.)', ts: '2025-10-11T10:01:30Z', sentiment: 'neutral', language: 'en' },
        { id: 'm62', from: 'customer', text: 'Done — I see the QR code.', ts: '2025-10-11T10:03:00Z', sentiment: 'happy', language: 'en' },
        { id: 'm63', from: 'agent', text: 'Step 2: Open your authenticator app, scan the QR code, then enter the 6-digit code shown. (Expected: verification success message.)', ts: '2025-10-11T10:03:30Z', sentiment: 'neutral', language: 'en' },
        { id: 'm64', from: 'customer', text: 'Done — verification succeeded and I see a recovery code. Logged in again automatically.', ts: '2025-10-11T10:04:30Z', sentiment: 'happy', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-11T10:00:00Z'
    },
    {
      id: 'T-1014',
      subject: 'Customer asks a persistent question but we know a tested resolution',
      customer: { name: 'Persistent User', email: 'persistent@example.com', language: 'en' },
      status: 'open',
      assignedTo: 'agent_2',
      messages: [
        { id: 'm65', from: 'customer', text: 'Sync still fails after your instructions. I did step A (restart), step B (clear cache), step C (reinstalled).', ts: '2025-10-13T11:00:00Z', sentiment: 'angry', language: 'en' },
        { id: 'm66', from: 'agent', text: 'Thanks for listing what you tried — I see steps A–C were attempted. Since those failed, the next validated action is to collect client logs and run a targeted sync test from our backend.', ts: '2025-10-13T11:02:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm67', from: 'customer', text: 'How do I collect client logs?', ts: '2025-10-13T11:03:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm68', from: 'agent', text: 'Please open Help → Diagnostics and click \'Export logs\'. Attach the generated file here. We will run the backend sync test after we receive logs.', ts: '2025-10-13T11:04:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm69', from: 'customer', text: 'Exported and attached the logs (logs_20251013.zip).', ts: '2025-10-13T11:10:00Z', sentiment: 'neutral', language: 'en' },
        { id: 'm70', from: 'agent', text: 'Received logs — I\'ll run the targeted sync test and escalate to engineering if needed. I will update you within 24 hours.', ts: '2025-10-13T11:12:00Z', sentiment: 'neutral', language: 'en' }
      ],
      kb_refs: [],
      created_at: '2025-10-13T11:00:00Z'
    }
  ],
  kb_articles: [
    { id: 'KB-101', title: 'Reset password steps', content: 'Step 1: Click forgot password. Step 2: Enter email. Step 3: Follow email instructions.' }
  ],
  canned_responses: [
    { id: 'CR-1', title: 'Password Reset Template', text: 'Hi {{name}}, please try resetting your password here: https://example.com/reset' },
    { id: 'CR-2', title: 'Refund Process', text: 'Hi {{name}}, refunds take 5-7 business days. If you haven\'t received it, please share the transaction ID.' }
  ],
  agents: [
    { id: 'agent_1', name: 'Priya' },
    { id: 'agent_2', name: 'Rahul' }
  ],
  telemetry: {
    events: []
  },
  admin_config: {
    features: {
      write_with_ai: true,
      summarize: true,
      sentiment: true,
      live_translate: true,
      reply_suggester: true,
      reply_verifier: true
    },
    reply_suggester_sources: {
      solution_articles: true,
      similar_tickets: true,
      canned_responses: true,
      tickets: true
    },
    brand_voice: {
      enabled: true,
      archetype: 'Friendly',
      custom_lexicon: ['workspace (not account)', 'team member (not user)'],
      sample_rules: 'Use short paragraphs; avoid slang.',
      company_name: 'Acme Corporation',
      industry: 'SaaS',
      formality: 'Neutral',
      emoji_usage: 'Sparingly',
      learning_example_replies: 'Hi Asha, I\'m sorry to hear you\'re having trouble logging in! That sounds frustrating. Could you please let me know what error message you\'re seeing?',
      learning_urls: 'https://example.com/kb\nhttps://example.com/about',
      learning_ticket_ids: '#1001, #1002',
      custom_lexicon_text: 'workspace (not account)\nteam member (not user)',
      response_archetypes_text: '## Apology\nDefinition: Use when the company made an error, service failed, or customer experienced an inconvenience caused by us.\n\nStructure:\n1. Acknowledge the specific issue immediately\n2. Express genuine empathy for their experience\n3. Take ownership and explain what went wrong\n4. Provide the solution or clear next steps\n5. Offer to help further if needed\n\nExample: "Hi Sarah, I sincerely apologize for the delay in processing your refund. I completely understand how frustrating this must be, especially after you\'ve been waiting for over a week. I\'ve looked into your account and can see that our payment system had a technical glitch that affected several transactions. I\'ve personally expedited your refund, and you should see it in your account within 24 hours. If you don\'t see it by tomorrow, please reach out to me directly and I\'ll follow up immediately."\n\n## Escalation\nDefinition: Use when the issue is beyond your scope, requires specialist knowledge, or previous attempts to resolve have failed.\n\nStructure:\n1. Acknowledge you understand the full scope of their issue\n2. Validate that this requires specialized attention\n3. Explain who will handle it and why they\'re better equipped\n4. Set clear expectations for timeline and next contact\n5. Assure them you\'re tracking it personally\n\nExample: "Thanks for providing those additional details, James. I now have a complete understanding of the integration issue you\'re facing with our API. This is definitely more complex than a standard setup, and I want to make sure you get the most accurate solution. I\'m escalating your case to our senior technical team who specialize in custom integrations. They have much deeper expertise in this area and will be able to provide you with the exact configuration you need. You can expect a detailed response from them within 24 hours. I\'ve flagged this as high priority and will personally monitor the progress to ensure it\'s resolved quickly."',
      my_style_enabled: true,
      auto_learn_enabled: false,
      selected_agent_id: 'agent_1',
      style_test_input: '',
      style_test_output: '',
      guidelines_dos: ['Always be courteous and keep the customer first.'],
      guidelines_donts: []
    },
    verifier_rules: {
      block_inappropriate_language: true,
      detect_pii: true,
      detect_internal_links: true,
      brand_voice_adherence: true,
      repetitive_solution_check: true,
      required_phrases: ['Thank you for contacting Acme Support'],
      blocked_keywords: ['badword1', 'badword2'],
      verifier_timing: 'before_send'
    }
  },
  activeTicket: null,
  liveSuggestion: '',
  contextPanelVisible: true,
  filters: {
    status: 'all',
    sentiment: 'all',
    assigned: 'all'
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  const setActiveTicket = (ticket: Ticket | null) => {
    setState(prev => ({ ...prev, activeTicket: ticket, liveSuggestion: '' }));
  };

  const setLiveSuggestion = (suggestion: string) => {
    setState(prev => ({ ...prev, liveSuggestion: suggestion }));
  };

  const setContextPanelVisible = (visible: boolean) => {
    setState(prev => ({ ...prev, contextPanelVisible: visible }));
  };

  const addTelemetryEvent = (event: TelemetryEvent) => {
    setState(prev => ({
      ...prev,
      telemetry: {
        events: [...prev.telemetry.events, { ...event, ts: new Date().toISOString() }]
      }
    }));
  };

  const updateAdminConfig = (config: Partial<AdminConfig>) => {
    setState(prev => ({
      ...prev,
      admin_config: { ...prev.admin_config, ...config }
    }));
  };

  const addTicket = (ticket: Ticket) => {
    setState(prev => ({
      ...prev,
      tickets: [...prev.tickets, ticket]
    }));
  };

  const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t),
      activeTicket: prev.activeTicket?.id === ticketId ? { ...prev.activeTicket, ...updates } : prev.activeTicket
    }));
  };

  const addMessage = (ticketId: string, message: Message) => {
    setState(prev => {
      const updatedTickets = prev.tickets.map(t => 
        t.id === ticketId 
          ? { ...t, messages: [...t.messages, message] }
          : t
      );
      return {
        ...prev,
        tickets: updatedTickets,
        activeTicket: prev.activeTicket?.id === ticketId 
          ? { ...prev.activeTicket, messages: [...prev.activeTicket.messages, message] }
          : prev.activeTicket
      };
    });
  };

  const setFilters = (filters: Partial<AppState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  };

  return (
    <AppContext.Provider value={{
      state,
      setActiveTicket,
      setLiveSuggestion,
      setContextPanelVisible,
      addTelemetryEvent,
      updateAdminConfig,
      addTicket,
      updateTicket,
      addMessage,
      setFilters
    }}>
      {children}
    </AppContext.Provider>
  );
};
