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
  my_style_examples: string;
  my_style_enabled: boolean;
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
    events: [
      { event: 'reply_suggester_generated', ticketId: 'T-1001', sourcesUsed: ['solution_articles', 'canned_responses'], ts: '2025-10-20T09:10:00Z' },
      { event: 'write_with_ai_used', action: 'rephrase', ticketId: 'T-1001', agentId: 'agent_1', ts: '2025-10-20T09:11:00Z' }
    ]
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
      canned_responses: true
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
      response_archetypes_text: '## Apology\n1. Acknowledge the issue immediately.\n2. Express genuine empathy.\n3. State the facts (what went wrong).\n4. Provide the fix or next steps.\n\nExample: \'Hi {{name}}, I\'m so sorry to hear you\'re running into [Issue]. That must be frustrating. I\'ve looked into this, and it seems... To fix this, please try...\'\n\n## Escalation\n1. Confirm understanding of the problem.\n2. Apologize for the difficulty.\n3. Explain that you are escalating to a specialist.\n4. Set an expectation for the next reply.\n\nExample: \'Thanks for clarifying, {{name}}. I understand now that [Problem] is happening, and I apologize that we haven\'t been able to solve this yet. I am escalating your ticket to our specialist team who can investigate further. We will get back to you within 24 hours.\'',
      my_style_examples: 'Hi Asha — can you tell me the error?\nThanks for contacting us!',
      my_style_enabled: true
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
