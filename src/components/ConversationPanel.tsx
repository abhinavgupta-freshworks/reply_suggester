import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Sparkles, AlertTriangle } from 'lucide-react';
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
import { CompactAIComposer } from './CompactAIComposer';

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
  const [verifierFlags, setVerifierFlags] = useState<VerifierFlag[]>([]);
  const [showVerifier, setShowVerifier] = useState(false);
  const [suggestedFix, setSuggestedFix] = useState('');
  const [currentDraft, setCurrentDraft] = useState(''); // Store draft for verifier dialog
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

  const generateSuggestedFix = (flags: VerifierFlag[], draftText: string): string => {
    let fixedDraft = draftText;

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

  const runVerifier = (draftText: string): boolean => {
    setCurrentDraft(draftText); // Store for dialog display
    const flags: VerifierFlag[] = [];

    // PII detection
    if (/\d{12,}/.test(draftText)) {
      const match = draftText.match(/\d{12,}/);
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
    if (draftText.includes('staging.') || draftText.includes('internal.example.com')) {
      const links = [];
      if (draftText.includes('staging.')) links.push('staging.*');
      if (draftText.includes('internal.example.com')) links.push('internal.example.com');
      flags.push({
        type: 'INTERNAL_LINK',
        text: links.join(', '),
        message: `Internal link(s) detected: ${links.join(', ')}`,
        suggestion: 'Replace with public-facing URLs or remove internal references.'
      });
    }

    // Required phrases
    state.admin_config.verifier_rules.required_phrases.forEach(phrase => {
      if (!draftText.includes(phrase)) {
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
      if (pm && draftText.includes(pm)) {
        flags.push({
          type: 'REPETITIVE',
          text: pm.slice(0, 50) + '...',
          message: 'Repetitive solution: This or similar text was already sent',
          suggestion: 'Consider rephrasing or providing additional context.'
        });
      }
    });

    if (flags.length > 0) {
      setSuggestedFix(generateSuggestedFix(flags, draftText));
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
    proceedWithSend(currentDraft);
  };

  const handleApplyFix = () => {
    // Note: This would need to update the draft in CompactAIComposer
    // For now, just close the dialog and let user manually apply changes
    setShowVerifier(false);
    toast.info('Please review and apply the suggested changes manually');
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
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{currentDraft}</p>
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

      {/* Compact AI Composer */}
      <div className="p-4">
        <CompactAIComposer
          ticketId={state.activeTicket.id}
          customerName={state.activeTicket.customer.name}
          ticketSubject={state.activeTicket.subject}
          onSend={proceedWithSend}
          onVerify={runVerifier}
          showVerify={state.admin_config.features.reply_verifier}
          liveSuggestion={state.liveSuggestion}
          onSuggestionChange={generateLiveSuggestion}
        />
      </div>
    </Card>
  );
};
