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
  auto_learn_enabled: boolean;
  selected_agent_id: string;
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
      my_style_examples: 'Hi Asha — can you tell me the error?\nThanks for contacting us!',
      my_style_enabled: true,
      auto_learn_enabled: false,
      selected_agent_id: 'agent_1',
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
