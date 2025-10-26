import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Sparkles, Send, CheckCircle, AlertTriangle, ChevronDown, 
  Bold, Italic, Underline, List, ListOrdered, Link2, Code 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface VerifierFlag {
  type: string;
  text: string;
  message: string;
  suggestion?: string;
}

interface ReplyEditorProps {
  ticketId: string;
  customerName: string;
  ticketSubject: string;
  lastCustomerMessage: string;
  onSendReply: (text: string) => void;
}

export const ReplyEditor = ({ ticketId, customerName, ticketSubject, lastCustomerMessage, onSendReply }: ReplyEditorProps) => {
  const { state, addTelemetryEvent, setLiveSuggestion } = useAppContext();
  const [draft, setDraft] = useState('');
  const [verifierFlags, setVerifierFlags] = useState<VerifierFlag[]>([]);
  const [showVerifier, setShowVerifier] = useState(false);
  const [suggestedFix, setSuggestedFix] = useState('');
  const [selectedSources, setSelectedSources] = useState({
    solution_articles: true,
    similar_tickets: true,
    canned_responses: true,
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate context-aware suggestions
  const generateSuggestions = (): string[] => {
    const availableSources = {
      solution_articles: selectedSources.solution_articles && state.admin_config.reply_suggester_sources.solution_articles,
      similar_tickets: selectedSources.similar_tickets && state.admin_config.reply_suggester_sources.similar_tickets,
      canned_responses: selectedSources.canned_responses && state.admin_config.reply_suggester_sources.canned_responses,
    };

    const hasAnySources = availableSources.solution_articles || availableSources.similar_tickets || availableSources.canned_responses;
    if (!hasAnySources) return [];

    const suggestions: string[] = [];
    const messageText = lastCustomerMessage.toLowerCase();
    const subject = ticketSubject.toLowerCase();

    // Context-aware suggestions based on ticket content
    if (availableSources.solution_articles) {
      if (messageText.includes('login') || subject.includes('login')) {
        suggestions.push(`Hi ${customerName}, I can help you with your login issue. Let me guide you through the troubleshooting steps.`);
      } else if (messageText.includes('password') || subject.includes('password')) {
        suggestions.push(`Hi ${customerName}, I'll help you reset your password. I'll send a reset link to your registered email address.`);
      } else if (messageText.includes('refund') || subject.includes('refund')) {
        suggestions.push(`Hi ${customerName}, I understand you're inquiring about a refund. Let me check the status for you.`);
      } else {
        suggestions.push(`Hi ${customerName}, based on our knowledge base, I can help you with "${ticketSubject}".`);
      }
    }

    if (availableSources.similar_tickets) {
      suggestions.push(`Thank you for reaching out. We've seen similar cases before. Let me help you resolve this.`);
    }

    if (availableSources.canned_responses) {
      suggestions.push(`Hi ${customerName}, I'm looking into your request regarding "${ticketSubject}" right away.`);
    }

    // Fallback
    if (suggestions.length === 0) {
      suggestions.push(`Hi ${customerName}, thanks for contacting us. I'm looking into "${ticketSubject}" and will respond shortly.`);
    }

    return suggestions.slice(0, 3);
  };

  // Initial suggestions on mount
  useEffect(() => {
    if (state.admin_config.features.reply_suggester) {
      const newSuggestions = generateSuggestions();
      setSuggestions(newSuggestions);
      if (newSuggestions.length > 0 && !draft) {
        setLiveSuggestion(newSuggestions[0]);
      }
      addTelemetryEvent({
        event: 'reply_suggester_generated',
        ticketId,
        agentId: 'agent_1'
      });
    }
  }, [ticketId]);

  // Update suggestions when sources change
  useEffect(() => {
    if (!state.admin_config.features.reply_suggester) return;

    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
    
    if (!draft.trim() && newSuggestions.length > 0) {
      setLiveSuggestion(newSuggestions[0]);
    } else if (!draft.trim()) {
      setLiveSuggestion('');
    }

    addTelemetryEvent({
      event: 'reply_suggester_sources_changed',
      ticketId,
      agentId: 'agent_1',
      sources: selectedSources,
    });
  }, [selectedSources]);

  const generateLiveSuggestion = (text: string) => {
    if (!text || text.endsWith(' ')) {
      setLiveSuggestion('');
      return;
    }

    const availableSources = {
      solution_articles: selectedSources.solution_articles && state.admin_config.reply_suggester_sources.solution_articles,
      similar_tickets: selectedSources.similar_tickets && state.admin_config.reply_suggester_sources.similar_tickets,
      canned_responses: selectedSources.canned_responses && state.admin_config.reply_suggester_sources.canned_responses,
    };

    const hasAnySources = availableSources.solution_articles || availableSources.similar_tickets || availableSources.canned_responses;
    if (!hasAnySources) {
      setLiveSuggestion('');
      return;
    }

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
    if (e.key === 'Tab' && state.liveSuggestion && state.liveSuggestion.trim()) {
      e.preventDefault();
      const newDraft = draft + state.liveSuggestion;
      setDraft(newDraft);
      setLiveSuggestion('');
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newDraft.length, newDraft.length);
        }
      }, 0);
      
      addTelemetryEvent({
        event: 'reply_suggester_accepted',
        ticketId,
        agentId: 'agent_1'
      });
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.substring(start, end);
    
    let before = '';
    let after = '';
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        before = '**';
        after = '**';
        newText = selectedText || 'bold text';
        cursorOffset = selectedText ? before.length + newText.length + after.length : before.length;
        break;
      case 'italic':
        before = '_';
        after = '_';
        newText = selectedText || 'italic text';
        cursorOffset = selectedText ? before.length + newText.length + after.length : before.length;
        break;
      case 'underline':
        before = '__';
        after = '__';
        newText = selectedText || 'underlined text';
        cursorOffset = selectedText ? before.length + newText.length + after.length : before.length;
        break;
      case 'bulletList':
        if (selectedText) {
          newText = selectedText
            .split('\n')
            .map((l) => l.trim() ? `- ${l}` : '')
            .join('\n');
          cursorOffset = newText.length;
        } else {
          const needsNewline = start > 0 && draft[start - 1] !== '\n';
          before = needsNewline ? '\n- ' : '- ';
          newText = 'list item';
          cursorOffset = before.length + newText.length;
        }
        break;
      case 'numberedList':
        if (selectedText) {
          newText = selectedText
            .split('\n')
            .map((l, i) => l.trim() ? `${i + 1}. ${l}` : '')
            .join('\n');
          cursorOffset = newText.length;
        } else {
          const needsNewline = start > 0 && draft[start - 1] !== '\n';
          before = needsNewline ? '\n1. ' : '1. ';
          newText = 'list item';
          cursorOffset = before.length + newText.length;
        }
        break;
      case 'link':
        before = '[';
        after = '](url)';
        newText = selectedText || 'link text';
        cursorOffset = before.length + newText.length;
        break;
      case 'code':
        before = '`';
        after = '`';
        newText = selectedText || 'code';
        cursorOffset = selectedText ? before.length + newText.length + after.length : before.length;
        break;
    }

    const replacement = before + newText + (after || '');
    const newDraft = draft.substring(0, start) + replacement + draft.substring(end);
    setDraft(newDraft);
    setLiveSuggestion('');
    
    setTimeout(() => {
      textarea.focus();
      const finalCursorPos = start + cursorOffset;
      textarea.setSelectionRange(finalCursorPos, finalCursorPos);
    }, 0);
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
        result = `Hi ${customerName} — thanks for reaching out. ${textToTransform} [Applied ${archetype} brand tone]`;
        break;
      case 'My style':
        result = `${textToTransform} [Applied your personal writing style]`;
        break;
    }

    if (selectedText) {
      const newDraft = draft.substring(0, start) + result + draft.substring(end);
      setDraft(newDraft);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + result.length, start + result.length);
      }, 0);
    } else {
      setDraft(result);
    }

    setLiveSuggestion('');
    addTelemetryEvent({
      event: 'write_with_ai_used',
      action,
      ticketId,
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

    if (flags.length > 0) {
      setSuggestedFix(generateSuggestedFix(flags));
    }

    setVerifierFlags(flags);
    setShowVerifier(flags.length > 0);

    addTelemetryEvent({
      event: 'verifier_run',
      ticketId,
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
    if (!text.trim()) return;
    onSendReply(text);
    setDraft('');
    setLiveSuggestion('');
    setShowVerifier(false);
    setVerifierFlags([]);
  };

  const handleSend = () => {
    if (!draft.trim()) return;

    if (state.admin_config.features.reply_verifier) {
      const canSend = runVerifier();
      if (!canSend) {
        return;
      }
    }

    proceedWithSend(draft);
  };

  return (
    <div className="border-t border-border bg-background p-4" style={{ height: '280px' }}>
      {/* Suggested Replies Strip */}
      {state.admin_config.features.reply_suggester && suggestions.length > 0 && (
        <div className="mb-3 pb-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Suggested replies:</p>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  const insertText = !draft.trim() ? suggestion : `\n\n${suggestion}`;
                  setDraft(draft + insertText);
                  setLiveSuggestion('');
                  addTelemetryEvent({
                    event: 'suggestion_clicked',
                    ticketId,
                    suggestionIndex: idx,
                    agentId: 'agent_1'
                  });
                  toast.success('Suggestion inserted');
                  setTimeout(() => {
                    textareaRef.current?.focus();
                  }, 0);
                }}
                className="text-xs h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/50 text-left justify-start"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Formatting & AI Toolbar */}
      <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('bold')} className="h-8 w-8 p-0" title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('italic')} className="h-8 w-8 p-0" title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('underline')} className="h-8 w-8 p-0" title="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('bulletList')} className="h-8 w-8 p-0" title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('numberedList')} className="h-8 w-8 p-0" title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('link')} className="h-8 w-8 p-0" title="Link">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => insertFormatting('code')} className="h-8 w-8 p-0" title="Code">
          <Code className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        {/* Write with AI Dropdown */}
        {state.admin_config.features.write_with_ai && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">Write with AI</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-50 bg-popover">
              {['Rephrase', 'More formal', 'Less formal', 'Expand', 'Brand tone', 'My style'].map(action => (
                <DropdownMenuItem key={action} onClick={() => handleAIAction(action)} disabled={!draft}>
                  <Sparkles className="h-3 w-3 mr-2" />
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sources Dropdown */}
        {state.admin_config.features.reply_suggester && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <span className="text-xs">🔍 Sources</span>
                <span className="text-xs opacity-60">
                  ({Object.values(selectedSources).filter(Boolean).length}/3)
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-50 bg-popover">
              {[
                { key: 'solution_articles', label: 'Solution Articles' },
                { key: 'similar_tickets', label: 'Similar Tickets' },
                { key: 'canned_responses', label: 'Canned Responses' },
              ].map(source => {
                const adminEnabled = state.admin_config.reply_suggester_sources[source.key as keyof typeof state.admin_config.reply_suggester_sources];
                const isDisabled = !adminEnabled;
                
                return (
                  <DropdownMenuCheckboxItem
                    key={source.key}
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
                  >
                    {source.label}
                    {isDisabled && <span className="text-muted-foreground ml-1 text-xs">(Disabled)</span>}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />

        {/* Verify Button */}
        {state.admin_config.features.reply_verifier && (
          <Button variant="ghost" size="sm" onClick={runVerifier} className="h-8">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Verify</span>
          </Button>
        )}
      </div>

      {/* Textarea */}
      <div className="space-y-2 mb-3">
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
      </div>

      {/* Tab hint & Send button */}
      <div className="flex items-center justify-between">
        {state.liveSuggestion ? (
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Tab</kbd> to accept suggestion
          </p>
        ) : (
          <div />
        )}
        <Button onClick={handleSend} disabled={!draft.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Send Reply
        </Button>
      </div>

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

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Suggested Corrected Reply:</h4>
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-sm whitespace-pre-wrap">{suggestedFix}</p>
              </div>
            </div>

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
    </div>
  );
};
