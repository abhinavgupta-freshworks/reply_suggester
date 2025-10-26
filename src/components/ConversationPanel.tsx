import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Sparkles, Send, CheckCircle, AlertTriangle, ChevronDown, 
  Bold, Italic, Underline, List, ListOrdered, Link2, Code 
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.activeTicket?.messages]);

  // Generate multiple suggestions based on sources
  const generateSuggestions = (): string[] => {
    if (!state.activeTicket) return [];

    const availableSources = {
      solution_articles: selectedSources.solution_articles && state.admin_config.reply_suggester_sources.solution_articles,
      similar_tickets: selectedSources.similar_tickets && state.admin_config.reply_suggester_sources.similar_tickets,
      canned_responses: selectedSources.canned_responses && state.admin_config.reply_suggester_sources.canned_responses,
    };

    const hasAnySources = availableSources.solution_articles || availableSources.similar_tickets || availableSources.canned_responses;
    if (!hasAnySources) return [];

    const suggestions: string[] = [];
    const lastCustomerMsg = state.activeTicket.messages
      .filter(m => m.from === 'customer')
      .slice(-1)[0];
    const customerName = state.activeTicket.customer.name;
    const subject = state.activeTicket.subject.toLowerCase();

    if (availableSources.solution_articles) {
      if (lastCustomerMsg?.text.toLowerCase().includes('login') || lastCustomerMsg?.text.toLowerCase().includes('password')) {
        suggestions.push(`Hi ${customerName}, I can help you with your login issue. Please try resetting your password using the forgot password link.`);
      } else {
        suggestions.push(`Hi ${customerName}, based on our knowledge base, here's how to resolve this issue...`);
      }
    }

    if (availableSources.similar_tickets) {
      suggestions.push(`We've seen similar cases before. Let me help you with this ${subject}.`);
    }

    if (availableSources.canned_responses) {
      suggestions.push(`Thank you for reaching out. I'll assist you with ${subject} right away.`);
    }

    // Fallback if no specific suggestions
    if (suggestions.length === 0) {
      suggestions.push(`Hi ${customerName}, thanks for contacting us. I'm looking into your issue regarding ${subject}.`);
    }

    return suggestions.slice(0, 3);
  };

  const generateInitialSuggestion = () => {
    if (!state.activeTicket) return;

    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
    
    // Set first suggestion as live suggestion for the textarea
    if (newSuggestions.length > 0) {
      setLiveSuggestion(newSuggestions[0]);
    } else {
      setLiveSuggestion('');
    }
    
    // Track suggestion generation
    addTelemetryEvent({
      event: 'reply_suggester_generated',
      ticketId: state.activeTicket.id,
      agentId: 'agent_1'
    });
  };

  // Auto-generate initial suggestion when ticket changes
  useEffect(() => {
    if (state.activeTicket && state.admin_config.features.reply_suggester && !draft) {
      setIsInitialLoad(true);
      generateInitialSuggestion();
    }
  }, [state.activeTicket?.id]);

  // Update suggestions when sources change
  useEffect(() => {
    if (!state.activeTicket || !state.admin_config.features.reply_suggester) return;

    // Regenerate suggestions based on new source selection
    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
    
    // Update live suggestion in textarea
    if (!draft.trim() && newSuggestions.length > 0) {
      setLiveSuggestion(newSuggestions[0]);
    } else if (!draft.trim()) {
      setLiveSuggestion('');
    } else {
      generateLiveSuggestion(draft);
    }

    // Track regeneration on source toggle
    addTelemetryEvent({
      event: 'reply_suggester_sources_changed',
      ticketId: state.activeTicket.id,
      agentId: 'agent_1',
      sources: selectedSources,
    });
  }, [selectedSources]);

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

    // Don't generate if no sources are selected
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

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.substring(start, end);
    
    let before = '';
    let after = '';
    let newText = '';

    switch (format) {
      case 'bold':
        before = '**';
        after = '**';
        newText = selectedText || 'bold text';
        break;
      case 'italic':
        before = '_';
        after = '_';
        newText = selectedText || 'italic text';
        break;
      case 'underline':
        // Markdown doesn't natively support underline; we will simulate with double underscores
        before = '__';
        after = '__';
        newText = selectedText || 'underlined';
        break;
      case 'bulletList':
        before = selectedText ? '' : '\n- ';
        newText = selectedText
          ? selectedText
              .split('\n')
              .map((l) => (l.trim().length ? `- ${l}` : l))
              .join('\n')
          : 'list item';
        break;
      case 'numberedList':
        before = selectedText ? '' : '\n1. ';
        newText = selectedText
          ? selectedText
              .split('\n')
              .map((l, i) => (l.trim().length ? `${i + 1}. ${l}` : l))
              .join('\n')
          : 'list item';
        break;
      case 'link':
        before = '[';
        after = '](url)';
        newText = selectedText || 'link text';
        break;
      case 'code':
        before = '`';
        after = '`';
        newText = selectedText || 'code';
        break;
    }

    const replacement = before + newText + (after || '');
    const newDraft = draft.substring(0, start) + replacement + draft.substring(end);
    setDraft(newDraft);
    
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + (before ? before.length : 0) + newText.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
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
    const name = state.activeTicket?.customer.name || 'Customer';

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
        result = `${textToTransform} [Applied your personal writing style]`;
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
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
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
      </div>

      {/* AI Toolbar & Reply Editor - Fixed Height */}
      <div className="border-t border-border bg-background p-4 shrink-0 min-h-[280px]">
        {/* Suggested Replies Strip */}
        {state.admin_config.features.reply_suggester && suggestions.length > 0 && (
          <div className="mb-3 pb-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">Suggested replies:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!draft.trim()) {
                      setDraft(suggestion);
                    } else {
                      setDraft(draft + '\n\n' + suggestion);
                    }
                    addTelemetryEvent({
                      event: 'suggestion_clicked',
                      ticketId: state.activeTicket?.id,
                      suggestionIndex: idx,
                      agentId: 'agent_1'
                    });
                    toast.success('Suggestion inserted');
                  }}
                  className="text-xs h-auto py-1.5 px-3 hover:bg-primary/10 hover:border-primary/50"
                  title={suggestion}
                >
                  <span className="line-clamp-1">{suggestion.substring(0, 60)}{suggestion.length > 60 ? '...' : ''}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Formatting & AI Toolbar */}
        <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
          {/* Text Formatting Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('bold')}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('italic')}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('underline')}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('bulletList')}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('numberedList')}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('link')}
            className="h-8 w-8 p-0"
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('code')}
            className="h-8 w-8 p-0"
            title="Code"
          >
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
                  <DropdownMenuItem
                    key={action}
                    onClick={() => handleAIAction(action)}
                    disabled={!draft}
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    {action}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Reply Suggester Sources Dropdown */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={runVerifier}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Verify</span>
            </Button>
          )}
        </div>

        {/* Textarea */}
        <div className="space-y-2">
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
        <div className="flex items-center justify-between mt-3">
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
      </div>
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
    </Card>
  );
};
