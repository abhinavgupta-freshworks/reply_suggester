import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Sparkles, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const sentimentEmoji: Record<string, string> = {
  happy: '😀',
  neutral: '😐',
  sad: '😞',
  angry: '😡',
};

interface VerifierFlag {
  type: string;
  text: string;
  message: string;
}

export const ConversationPanel = () => {
  const { state, addMessage, addTelemetryEvent, setLiveSuggestion } = useAppContext();
  const [draft, setDraft] = useState('');
  const [verifierFlags, setVerifierFlags] = useState<VerifierFlag[]>([]);
  const [showVerifier, setShowVerifier] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.activeTicket?.messages]);

  const generateLiveSuggestion = (text: string) => {
    if (!text || text.endsWith(' ')) {
      setLiveSuggestion('');
      return;
    }

    const lower = text.toLowerCase();
    let suggestion = '';

    if (lower.endsWith('login')) {
      suggestion = ' please try resetting your password.';
    } else if (lower.endsWith('refund')) {
      suggestion = ' refunds take 5-7 business days.';
    } else if (lower.endsWith('hi') || lower.endsWith('hello')) {
      suggestion = ' thanks for contacting us.';
    } else if (lower.endsWith('thanks')) {
      suggestion = ' you are welcome!';
    }

    setLiveSuggestion(suggestion);
  };

  const handleDraftChange = (text: string) => {
    setDraft(text);
    if (state.admin_config.features.reply_suggester) {
      generateLiveSuggestion(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && state.liveSuggestion) {
      e.preventDefault();
      setDraft(draft + state.liveSuggestion);
      setLiveSuggestion('');
      addTelemetryEvent({
        event: 'reply_suggester_accepted',
        ticketId: state.activeTicket?.id
      });
    }
  };

  const handleAIAction = (action: string) => {
    if (!draft) return;

    let result = '';
    const name = state.activeTicket?.customer.name || 'Customer';

    switch (action) {
      case 'Rephrase':
      case 'More formal':
        result = `[Simulated AI] More formal: ${draft.replace(/can't/g, 'cannot').replace(/I'm/g, 'I am')}`;
        break;
      case 'Less formal':
        result = `[Simulated AI] Less formal: ${draft.replace(/I am/g, "I'm").replace(/cannot/g, "can't")}`;
        break;
      case 'Expand':
        result = `[Simulated AI] Expanded: ${draft} If you need, we can also provide further steps.`;
        break;
      case 'Brand tone':
        result = `[Simulated AI] Brand (Friendly): Hi ${name} — thanks for reaching out. ${draft}`;
        break;
      case 'My style':
        result = `[Simulated AI] My style applied: ${draft}`;
        break;
    }

    setDraft(result);
    setLiveSuggestion('');
    addTelemetryEvent({
      event: 'write_with_ai_used',
      action,
      ticketId: state.activeTicket?.id,
      agentId: 'agent_1'
    });
  };

  const runVerifier = (): boolean => {
    const flags: VerifierFlag[] = [];

    // PII detection
    if (/\d{12,}/.test(draft)) {
      const match = draft.match(/\d{12,}/);
      if (match) {
        flags.push({ type: 'PII', text: match[0], message: 'Potential PII detected' });
      }
    }

    // Internal links
    if (draft.includes('staging.') || draft.includes('internal.example.com')) {
      flags.push({ type: 'INTERNAL_LINK', text: 'staging/internal', message: 'Internal link detected' });
    }

    // Required phrases
    state.admin_config.verifier_rules.required_phrases.forEach(phrase => {
      if (!draft.includes(phrase)) {
        flags.push({ type: 'REQUIRED_PHRASE', text: phrase, message: `Required phrase missing: ${phrase}` });
      }
    });

    // Repetitive check
    const prevAgentMsgs = state.activeTicket?.messages.filter(m => m.from === 'agent').map(m => m.text) || [];
    prevAgentMsgs.forEach(pm => {
      if (pm && draft.includes(pm)) {
        flags.push({ type: 'REPETITIVE', text: pm.slice(0, 50), message: 'This solution was already suggested' });
      }
    });

    setVerifierFlags(flags);
    setShowVerifier(flags.length > 0);

    addTelemetryEvent({
      event: 'verifier_run',
      ticketId: state.activeTicket?.id,
      flags,
      agentId: 'agent_1'
    });

    const timing = state.admin_config.verifier_rules.verifier_timing;
    if (timing === 'after_send') {
      return true;
    }
    return flags.length === 0;
  };

  const handleSend = () => {
    if (!draft.trim() || !state.activeTicket) return;

    if (state.admin_config.features.reply_verifier) {
      const canSend = runVerifier();
      if (!canSend) {
        toast.error('Verifier found issues. Please review before sending.');
        return;
      }
    }

    const message = {
      id: `m${Date.now()}`,
      from: 'agent' as const,
      text: draft,
      ts: new Date().toISOString(),
      sentiment: 'neutral' as const,
      language: 'en'
    };

    addMessage(state.activeTicket.id, message);
    addTelemetryEvent({
      event: 'reply_sent',
      ticketId: state.activeTicket.id,
      textPreview: draft.slice(0, 80),
      agentId: 'agent_1'
    });

    setDraft('');
    setLiveSuggestion('');
    setShowVerifier(false);
    setVerifierFlags([]);
    toast.success('Reply sent');
  };

  const handleSummarize = () => {
    if (!state.activeTicket) return;

    const lastCustomerMsg = state.activeTicket.messages
      .filter(m => m.from === 'customer')
      .slice(-1)[0];

    const summary = `[Simulated AI] Summary: Issue: ${state.activeTicket.subject}. Last customer message: '${lastCustomerMsg?.text || 'none'}'. Next step: Review KB ${state.activeTicket.kb_refs.join(',') || 'none'}.`;

    toast.info(summary);
    addTelemetryEvent({
      event: 'summarize_used',
      ticketId: state.activeTicket.id
    });
  };

  if (!state.activeTicket) {
    return (
      <Card className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Select a ticket to view conversation</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col p-0">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{state.activeTicket.id}</span>
              <Badge variant="outline">{state.activeTicket.status}</Badge>
            </div>
            <h2 className="text-lg font-semibold">{state.activeTicket.subject}</h2>
            <p className="text-sm text-muted-foreground">{state.activeTicket.customer.name} • {state.activeTicket.customer.email}</p>
          </div>
          {state.admin_config.features.summarize && (
            <Button variant="outline" size="sm" onClick={handleSummarize}>
              <Sparkles className="h-4 w-4 mr-2" />
              Summarize
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {state.activeTicket.messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.from === 'agent' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.from === 'agent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.from === 'agent' ? 'Agent' : state.activeTicket.customer.name}
                  </span>
                  {state.admin_config.features.sentiment && message.from === 'customer' && (
                    <span className="text-sm">{sentimentEmoji[message.sentiment]}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.ts).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* AI Toolbar */}
      {state.admin_config.features.write_with_ai && draft && (
        <div className="border-t border-border p-2 flex flex-wrap gap-1">
          {['Rephrase', 'More formal', 'Less formal', 'Expand', 'Brand tone', 'My style'].map(action => (
            <Button
              key={action}
              variant="ghost"
              size="sm"
              onClick={() => handleAIAction(action)}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {action}
            </Button>
          ))}
        </div>
      )}

      {/* Verifier Flags */}
      {showVerifier && verifierFlags.length > 0 && (
        <div className="border-t border-warning/30 bg-warning/5 p-3">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Verifier Flags</p>
              <div className="space-y-1 mt-1">
                {verifierFlags.map((flag, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium">{flag.type}:</span> {flag.message}
                  </p>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowVerifier(false)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Reply Editor */}
      <div className="border-t border-border p-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply here... (Try typing 'login' or 'refund' and press Tab)"
            className="min-h-[100px] resize-none pr-12"
          />
          {state.liveSuggestion && (
            <div className="absolute left-3 top-3 pointer-events-none">
              <span className="text-muted-foreground/40 whitespace-pre">
                {draft}
                <span className="text-muted-foreground/60">{state.liveSuggestion}</span>
              </span>
            </div>
          )}
        </div>
        {state.liveSuggestion && (
          <p className="text-xs text-muted-foreground mt-1">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Tab</kbd> to accept suggestion
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            {state.admin_config.features.reply_verifier && (
              <Button
                variant="outline"
                size="sm"
                onClick={runVerifier}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
            )}
          </div>
          <Button onClick={handleSend} disabled={!draft.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </div>
      </div>
    </Card>
  );
};
