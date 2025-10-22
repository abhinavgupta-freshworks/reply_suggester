import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Sparkles, Send, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from './ui/checkbox';

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
  suggestion?: string;
}

export const ConversationPanel = () => {
  const { state, addMessage, addTelemetryEvent, setLiveSuggestion } = useAppContext();
  const [draft, setDraft] = useState('');
  const [verifierFlags, setVerifierFlags] = useState<VerifierFlag[]>([]);
  const [showVerifier, setShowVerifier] = useState(false);
  const [suggestedFix, setSuggestedFix] = useState('');
  const [selectedSources, setSelectedSources] = useState({
    solution_articles: true,
    similar_tickets: true,
    canned_responses: true,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.activeTicket?.messages]);

  // Auto-generate initial suggestion when ticket changes
  useEffect(() => {
    if (state.activeTicket && state.admin_config.features.reply_suggester && !draft) {
      generateInitialSuggestion();
    }
  }, [state.activeTicket?.id]);

  // Update suggestion when sources change
  useEffect(() => {
    if (state.activeTicket && state.admin_config.features.reply_suggester) {
      // Clear current suggestion and regenerate
      setLiveSuggestion('');
      if (!draft) {
        generateInitialSuggestion();
      } else {
        generateLiveSuggestion(draft);
      }
    }
  }, [selectedSources, draft]);

  const generateInitialSuggestion = () => {
    if (!state.activeTicket) return;

    const availableSources = {
      solution_articles: selectedSources.solution_articles && state.admin_config.reply_suggester_sources.solution_articles,
      similar_tickets: selectedSources.similar_tickets && state.admin_config.reply_suggester_sources.similar_tickets,
      canned_responses: selectedSources.canned_responses && state.admin_config.reply_suggester_sources.canned_responses,
    };

    const lastCustomerMsg = state.activeTicket.messages
      .filter(m => m.from === 'customer')
      .slice(-1)[0];

    let suggestion = '';

    if (!lastCustomerMsg) {
      suggestion = 'Hi, thanks for reaching out. How can I help you today?';
    } else {
      const lower = lastCustomerMsg.text.toLowerCase();
      
      if (availableSources.solution_articles && (lower.includes('login') || lower.includes('password'))) {
        suggestion = 'Hi, thanks for contacting us. I can help you with your login issue. Please try resetting your password using the forgot password link.';
      } else if (availableSources.canned_responses && lower.includes('refund')) {
        suggestion = 'Hi, I understand you need a refund. I can help you with that. Refunds typically take 5-7 business days to process.';
      } else if (availableSources.similar_tickets && (lower.includes('shipping') || lower.includes('delivery'))) {
        suggestion = 'Hi, thanks for reaching out about your delivery. Let me check the status of your shipment for you.';
      } else {
        suggestion = `Hi ${state.activeTicket.customer.name}, thanks for contacting us. I'm looking into your issue regarding ${state.activeTicket.subject.toLowerCase()}.`;
      }
    }

    setLiveSuggestion(suggestion);
  };

  const generateLiveSuggestion = (text: string) => {
    if (!text || text.endsWith(' ')) {
      setLiveSuggestion('');
      return;
    }

    // Check which sources are available
    const availableSources = {
      solution_articles: selectedSources.solution_articles && state.admin_config.reply_suggester_sources.solution_articles,
      similar_tickets: selectedSources.similar_tickets && state.admin_config.reply_suggester_sources.similar_tickets,
      canned_responses: selectedSources.canned_responses && state.admin_config.reply_suggester_sources.canned_responses,
    };

    const lower = text.toLowerCase();
    let suggestion = '';

    if (availableSources.solution_articles && lower.endsWith('login')) {
      suggestion = ' please try resetting your password.';
    } else if (availableSources.canned_responses && lower.endsWith('refund')) {
      suggestion = ' refunds take 5-7 business days.';
    } else if (availableSources.similar_tickets && (lower.endsWith('hi') || lower.endsWith('hello'))) {
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
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.substring(start, end);
    const textToTransform = selectedText || draft;

    if (!textToTransform) {
      toast.info('Please type some text first');
      return;
    }

    let result = '';
    const name = state.activeTicket?.customer.name || 'Customer';
    const myStyleConfig = state.admin_config.brand_voice.my_style_examples || '';

    switch (action) {
      case 'Rephrase':
        result = `${textToTransform.replace(/very/g, 'extremely').replace(/good/g, 'excellent')}`;
        break;
      case 'More formal':
        result = `${textToTransform.replace(/can't/g, 'cannot').replace(/I'm/g, 'I am').replace(/won't/g, 'will not')}`;
        break;
      case 'Less formal':
        result = `${textToTransform.replace(/I am/g, "I'm").replace(/cannot/g, "can't").replace(/will not/g, "won't")}`;
        break;
      case 'Expand':
        result = `${textToTransform} Additionally, if you need any further assistance with this matter, please don't hesitate to reach out.`;
        break;
      case 'Brand tone':
        const archetype = state.admin_config.brand_voice.archetype || 'Friendly';
        result = `Hi ${name} — thanks for reaching out. ${textToTransform} [Applied ${archetype} brand tone]`;
        break;
      case 'My style':
        result = `${textToTransform} [Applied your personal writing style${myStyleConfig ? ' from ' + myStyleConfig.split('\n')[0].slice(0, 30) + '...' : ''}]`;
        break;
    }

    if (selectedText) {
      // Replace only selected text
      const newDraft = draft.substring(0, start) + result + draft.substring(end);
      setDraft(newDraft);
      // Set cursor position after the replaced text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + result.length, start + result.length);
      }, 0);
    } else {
      // Replace entire text
      setDraft(result);
    }

    setLiveSuggestion('');
    addTelemetryEvent({
      event: 'write_with_ai_used',
      action,
      ticketId: state.activeTicket?.id,
      agentId: 'agent_1'
    });
    toast.success(`Applied: ${action}`);
  };

  const generateSuggestedFix = (flags: VerifierFlag[]): string => {
    let fixedDraft = draft;

    flags.forEach(flag => {
      switch (flag.type) {
        case 'PII':
          fixedDraft = fixedDraft.replace(/\d{12,}/g, '[REDACTED]');
          break;
        case 'INTERNAL_LINK':
          fixedDraft = fixedDraft.replace(/staging\./g, '').replace(/internal\.example\.com/g, 'example.com');
          break;
        case 'REQUIRED_PHRASE':
          if (!fixedDraft.startsWith(flag.text)) {
            fixedDraft = `${flag.text}\n\n${fixedDraft}`;
          }
          break;
        case 'REPETITIVE':
          // Suggest rephrasing
          fixedDraft = `[Consider rephrasing] ${fixedDraft}`;
          break;
      }
    });

    return fixedDraft;
  };

  const runVerifier = (): boolean => {
    const flags: VerifierFlag[] = [];

    // PII detection
    if (/\d{12,}/.test(draft)) {
      const match = draft.match(/\d{12,}/);
      if (match) {
        flags.push({
          type: 'PII',
          text: match[0],
          message: `Potential PII detected: "${match[0]}"`,
          suggestion: 'Remove or redact sensitive information like credit card numbers, SSNs, etc.'
        });
      }
    }

    // Internal links
    if (draft.includes('staging.') || draft.includes('internal.example.com')) {
      const links = [];
      if (draft.includes('staging.')) links.push('staging.*');
      if (draft.includes('internal.example.com')) links.push('internal.example.com');
      flags.push({
        type: 'INTERNAL_LINK',
        text: links.join(', '),
        message: `Internal link(s) detected: ${links.join(', ')}`,
        suggestion: 'Replace with public-facing URLs or remove internal references.'
      });
    }

    // Required phrases
    state.admin_config.verifier_rules.required_phrases.forEach(phrase => {
      if (!draft.includes(phrase)) {
        flags.push({
          type: 'REQUIRED_PHRASE',
          text: phrase,
          message: `Missing required phrase: "${phrase}"`,
          suggestion: `Add "${phrase}" to your reply (usually at the beginning).`
        });
      }
    });

    // Repetitive check
    const prevAgentMsgs = state.activeTicket?.messages.filter(m => m.from === 'agent').map(m => m.text) || [];
    prevAgentMsgs.forEach(pm => {
      if (pm && draft.includes(pm)) {
        flags.push({
          type: 'REPETITIVE',
          text: pm.slice(0, 50) + '...',
          message: 'Repetitive solution: This or similar text was already sent',
          suggestion: 'Consider rephrasing or providing additional context.'
        });
      }
    });

    if (flags.length > 0) {
      setSuggestedFix(generateSuggestedFix(flags));
    }

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

  const handleSendAnyway = () => {
    setShowVerifier(false);
    proceedWithSend(draft);
  };

  const handleApplyFix = () => {
    setDraft(suggestedFix);
    setShowVerifier(false);
    toast.success('Applied suggested fixes');
  };

  const proceedWithSend = (text: string) => {
    if (!text.trim() || !state.activeTicket) return;

    const message = {
      id: `m${Date.now()}`,
      from: 'agent' as const,
      text: text,
      ts: new Date().toISOString(),
      sentiment: 'neutral' as const,
      language: 'en'
    };

    addMessage(state.activeTicket.id, message);
    addTelemetryEvent({
      event: 'reply_sent',
      ticketId: state.activeTicket.id,
      textPreview: text.slice(0, 80),
      agentId: 'agent_1'
    });

    setDraft('');
    setLiveSuggestion('');
    setShowVerifier(false);
    setVerifierFlags([]);
    toast.success('Reply sent');
  };

  const handleSend = () => {
    if (!draft.trim() || !state.activeTicket) return;

    if (state.admin_config.features.reply_verifier) {
      const canSend = runVerifier();
      if (!canSend) {
        return; // Modal will show, user can choose to send anyway or fix
      }
    }

    proceedWithSend(draft);
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

      {/* AI Toolbar - Write with AI */}
      {state.admin_config.features.write_with_ai && (
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Write with AI</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {draft ? 'Select text or apply to all' : 'Type to enable'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {['Rephrase', 'More formal', 'Less formal', 'Expand', 'Brand tone', 'My style'].map(action => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleAIAction(action)}
                disabled={!draft}
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Verifier Dialog */}
      <AlertDialog open={showVerifier} onOpenChange={setShowVerifier}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Reply Verification Issues
            </AlertDialogTitle>
            <AlertDialogDescription>
              The verifier found {verifierFlags.length} issue{verifierFlags.length !== 1 ? 's' : ''} with your reply. Review the details below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            {/* Issues List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Issues Found:</h4>
              {verifierFlags.map((flag, i) => (
                <div key={i} className="border border-warning/30 rounded-lg p-3 bg-warning/5">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 border-warning text-warning">
                      {flag.type}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{flag.message}</p>
                      {flag.text && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Found:</span> "{flag.text}"
                        </p>
                      )}
                      {flag.suggestion && (
                        <p className="text-xs text-primary">
                          <span className="font-medium">Suggestion:</span> {flag.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Fix */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Suggested Corrected Reply:</h4>
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm whitespace-pre-wrap">{suggestedFix}</p>
              </div>
            </div>

            {/* Original for comparison */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Your Original Reply:</h4>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{draft}</p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={handleSendAnyway}>
              Send Anyway
            </Button>
            <Button onClick={handleApplyFix}>
              Apply Fix & Continue Editing
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reply Editor */}
      <div className="border-t border-border p-4">
        {/* Source Filter */}
        {state.admin_config.features.reply_suggester && (
          <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Reply Suggester Sources</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'solution_articles', label: 'Solution Articles' },
                { key: 'similar_tickets', label: 'Similar Tickets' },
                { key: 'canned_responses', label: 'Canned Responses' },
              ].map(source => {
                const adminEnabled = state.admin_config.reply_suggester_sources[source.key as keyof typeof state.admin_config.reply_suggester_sources];
                const isDisabled = !adminEnabled;
                
                return (
                  <div
                    key={source.key}
                    className={cn(
                      "flex items-center gap-2",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      id={source.key}
                      checked={selectedSources[source.key as keyof typeof selectedSources]}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => {
                        if (!isDisabled) {
                          setSelectedSources(prev => ({
                            ...prev,
                            [source.key]: checked as boolean
                          }));
                          toast.info(`${source.label} ${checked ? 'enabled' : 'disabled'}`);
                        }
                      }}
                    />
                    <label
                      htmlFor={source.key}
                      className={cn(
                        "text-xs font-medium cursor-pointer",
                        isDisabled && "cursor-not-allowed"
                      )}
                    >
                      {source.label}
                      {isDisabled && <span className="text-muted-foreground ml-1">(Admin disabled)</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply here..."
            className="min-h-[100px] resize-none pr-12"
          />
          {state.liveSuggestion && (
            <div className="absolute left-3 top-3 right-12 bottom-3 pointer-events-none overflow-hidden">
              <span className="text-muted-foreground/40 whitespace-pre-wrap break-words">
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
