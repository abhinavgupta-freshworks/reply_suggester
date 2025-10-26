import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LinkDialog } from './LinkDialog';
import { EmojiPicker } from './EmojiPicker';
import { FileAttachment } from './FileAttachment';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import {
  Sparkles,
  Filter,
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Paperclip,
  Smile,
  Undo,
  Redo,
  MoreHorizontal,
  Shuffle,
  GraduationCap,
  MessageCircle,
  Maximize2,
  Badge,
  Star,
} from 'lucide-react';

interface CompactAIComposerProps {
  ticketId: string;
  customerName: string;
  ticketSubject: string;
  onSend: (text: string) => void;
  onVerify?: (draftText: string) => boolean;
  showVerify?: boolean;
  liveSuggestion?: string;
  onSuggestionChange?: (text: string) => void;
}

const AI_ACTIONS = [
  { id: 'rephrase', label: 'Rephrase', subtitle: 'Keep meaning, change tone', icon: Shuffle },
  { id: 'more_formal', label: 'More formal', subtitle: 'Increase formality', icon: GraduationCap },
  { id: 'less_formal', label: 'Less formal', subtitle: 'More casual tone', icon: MessageCircle },
  { id: 'expand', label: 'Expand', subtitle: 'Add details and context', icon: Maximize2 },
  { id: 'brand_tone', label: 'Brand tone', subtitle: 'Apply saved brand voice', icon: Badge },
  { id: 'my_style', label: 'My style', subtitle: 'Use my saved style', icon: Star },
];

export const CompactAIComposer = ({
  ticketId,
  customerName,
  ticketSubject,
  onSend,
  onVerify,
  showVerify = false,
  liveSuggestion = '',
  onSuggestionChange,
}: CompactAIComposerProps) => {
  const [draft, setDraft] = useState('');
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedSources, setSelectedSources] = useState({
    solution_articles: true,
    similar_tickets: true,
    canned_responses: true,
    external_kb: false,
  });
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { addTelemetryEvent, state } = useAppContext();

  // Draft auto-save
  const { clearDraft } = useDraftAutoSave(ticketId, draft, setDraft);

  // Generate initial suggestion when ticket changes or sources change
  const generateInitialSuggestion = () => {
    if (!onSuggestionChange) return;

    const hasAnySources = selectedSources.solution_articles || 
                         selectedSources.similar_tickets || 
                         selectedSources.canned_responses || 
                         selectedSources.external_kb;
    
    if (!hasAnySources) {
      onSuggestionChange('');
      return;
    }

    // Generate contextual suggestion based on available sources
    let suggestion = '';
    
    if (selectedSources.solution_articles && selectedSources.similar_tickets && selectedSources.canned_responses) {
      suggestion = `Hi ${customerName}, thanks for contacting us! I've reviewed our knowledge base and similar cases. I'm looking into your request regarding ${ticketSubject}.`;
    } else if (selectedSources.solution_articles && selectedSources.similar_tickets) {
      suggestion = `Hi ${customerName}, thanks for reaching out. Based on our documentation and similar tickets, I'm here to help with ${ticketSubject}.`;
    } else if (selectedSources.solution_articles && selectedSources.canned_responses) {
      suggestion = `Hi ${customerName}, thank you for contacting us. According to our help articles, I can assist you with ${ticketSubject}.`;
    } else if (selectedSources.similar_tickets && selectedSources.canned_responses) {
      suggestion = `Hi ${customerName}, thanks for your message. I've seen similar requests and I'm ready to help with ${ticketSubject}.`;
    } else if (selectedSources.solution_articles) {
      suggestion = `Hi ${customerName}, thanks for reaching out. Based on our documentation, I'm looking into ${ticketSubject}.`;
    } else if (selectedSources.similar_tickets) {
      suggestion = `Hi ${customerName}, thank you for contacting us. This request has been seen before, and I'm here to help with ${ticketSubject}.`;
    } else if (selectedSources.canned_responses) {
      suggestion = `Hi ${customerName}, thank you for your message. I'm looking into your request regarding ${ticketSubject}.`;
    } else if (selectedSources.external_kb) {
      suggestion = `Hi ${customerName}, thanks for reaching out. I've consulted our external knowledge sources to help with ${ticketSubject}.`;
    } else {
      suggestion = `Hi ${customerName}, thanks for contacting us. I'm looking into your issue regarding ${ticketSubject}.`;
    }

    onSuggestionChange(suggestion);
  };

  // Generate initial suggestion when ticket changes
  useEffect(() => {
    if (!draft) {
      generateInitialSuggestion();
      setHasGeneratedInitial(true);
    }
  }, [ticketId]);

  // Regenerate when sources change (only if no draft yet)
  useEffect(() => {
    if (!draft) {
      generateInitialSuggestion();
    }
  }, [selectedSources]);

  // Handle AI actions
  const handleAIAction = (actionId: string) => {
    const selectedText = textareaRef.current?.value.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    const textToTransform = selectedText || draft;

    if (!textToTransform) {
      toast({
        title: 'No text to transform',
        description: 'Please type some text first',
        variant: 'destructive',
      });
      return;
    }

    // Simulate AI transformation (in real app, call API)
    let transformed = textToTransform;
    switch (actionId) {
      case 'rephrase':
        transformed = `${textToTransform} (rephrased)`;
        break;
      case 'more_formal':
        transformed = textToTransform.replace(/don't/g, 'do not').replace(/can't/g, 'cannot');
        break;
      case 'less_formal':
        transformed = textToTransform.replace(/do not/g, "don't").replace(/cannot/g, "can't");
        break;
      case 'expand':
        transformed = `${textToTransform} Additionally, I wanted to provide more context and details to help you better understand the situation.`;
        break;
      case 'brand_tone':
        transformed = `Hi ${customerName}, ${textToTransform} Let me know if you need anything else!`;
        break;
      case 'my_style':
        transformed = `${textToTransform} (styled)`;
        break;
    }

    setDraft(transformed);
    setShowAIDropdown(false);

    addTelemetryEvent({
      event: 'ai_action_invoked',
      action: actionId,
      ticketId,
      userId: state.activeTicket?.assignedTo,
    });

    toast({
      title: 'AI applied',
      description: `Applied ${AI_ACTIONS.find(a => a.id === actionId)?.label}`,
    });
  };

  // Apply formatting
  const applyFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    let formatted = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formatted = `${before}**${selectedText || 'bold text'}**${after}`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'italic':
        formatted = `${before}_${selectedText || 'italic text'}_${after}`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'underline':
        formatted = `${before}__${selectedText || 'underlined text'}__${after}`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'strikethrough':
        formatted = `${before}~~${selectedText || 'strikethrough'}~~${after}`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'bullet':
        formatted = `${before}\n- ${selectedText || 'list item'}${after}`;
        cursorOffset = 0;
        break;
      case 'numbered':
        formatted = `${before}\n1. ${selectedText || 'list item'}${after}`;
        cursorOffset = 0;
        break;
      case 'quote':
        formatted = `${before}\n> ${selectedText || 'quote'}${after}`;
        cursorOffset = 0;
        break;
      case 'code':
        formatted = `${before}\`${selectedText || 'code'}\`${after}`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      default:
        return;
    }

    setDraft(formatted);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = end + formatted.length - textarea.value.length + cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    addTelemetryEvent({
      event: 'formatting_used',
      format,
      ticketId,
    });
  };

  // Insert link
  const handleInsertLink = (text: string, url: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(textarea.selectionEnd);
    
    setDraft(`${before}[${text}](${url})${after}`);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  // Insert emoji
  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);
    
    setDraft(`${before}${emoji}${after}`);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Apply reply sources
  const handleApplyReplySources = () => {
    setShowSourcesModal(false);
    
    if (saveAsDefault) {
      localStorage.setItem('reply_sources_default', JSON.stringify(selectedSources));
    }

    addTelemetryEvent({
      event: 'reply_sources_applied',
      sources: selectedSources,
      ticketId,
    });

    toast({
      title: 'Sources updated',
      description: 'Reply suggester sources have been updated',
    });
  };

  // Handle send
  const handleSend = () => {
    if (!draft.trim()) {
      toast({
        title: 'Empty reply',
        description: 'Please type a reply first',
        variant: 'destructive',
      });
      return;
    }

    addTelemetryEvent({
      event: 'send_reply_clicked',
      ticketId,
      userId: state.activeTicket?.assignedTo,
    });

    onSend(draft);
    setDraft('');
    clearDraft();
  };

  // Handle verify
  const handleVerify = () => {
    if (!draft.trim()) {
      toast({
        title: 'Empty reply',
        description: 'Please type a reply first',
        variant: 'destructive',
      });
      return;
    }

    addTelemetryEvent({
      event: 'verify_clicked',
      ticketId,
    });

    if (onVerify) {
      onVerify(draft);
    }
  };

  // Handle draft change
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDraft = e.target.value;
    setDraft(newDraft);
    
    // Only generate suggestions if at least one source is selected
    const hasAnySources = selectedSources.solution_articles || 
                         selectedSources.similar_tickets || 
                         selectedSources.canned_responses || 
                         selectedSources.external_kb;
    
    if (onSuggestionChange) {
      if (hasAnySources) {
        onSuggestionChange(newDraft);
      } else {
        onSuggestionChange(''); // Clear suggestions if no sources
      }
    }
  };

  // Handle Tab to accept suggestion
  const handleAcceptSuggestion = () => {
    if (!liveSuggestion) return;
    
    setDraft(liveSuggestion);
    
    // Clear suggestion after accepting
    if (onSuggestionChange) {
      onSuggestionChange('');
    }

    addTelemetryEvent({
      event: 'reply_suggester_accepted',
      ticketId,
    });

    // Focus on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      // Move cursor to end
      const len = liveSuggestion.length;
      textareaRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  // Handle Tab to accept suggestion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && liveSuggestion && !draft) {
      e.preventDefault();
      handleAcceptSuggestion();
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'w',
      altKey: true,
      callback: () => setShowAIDropdown(true),
    },
    {
      key: 'f',
      altKey: true,
      callback: () => setShowSourcesModal(true),
    },
    {
      key: 'b',
      ctrlKey: true,
      callback: () => applyFormatting('bold'),
    },
    {
      key: 'i',
      ctrlKey: true,
      callback: () => applyFormatting('italic'),
    },
    {
      key: 'u',
      ctrlKey: true,
      callback: () => applyFormatting('underline'),
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: () => setShowLinkDialog(true),
    },
    {
      key: 'Enter',
      ctrlKey: true,
      callback: handleSend,
    },
  ], true);

  // Load default sources on mount
  useEffect(() => {
    const saved = localStorage.getItem('reply_sources_default');
    if (saved) {
      setSelectedSources(JSON.parse(saved));
    }
  }, []);

  const placeholder = `Hi ${customerName}, thanks for contacting us. I'm looking into your issue regarding ${ticketSubject}.`;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Write with AI Dropdown */}
          <DropdownMenu open={showAIDropdown} onOpenChange={setShowAIDropdown}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                aria-expanded={showAIDropdown}
                aria-controls="aiDropdown"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Write with AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[320px]" align="start">
              {AI_ACTIONS.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => handleAIAction(action.id)}
                  className="flex items-start gap-2 py-2"
                >
                  <action.icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.subtitle}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 rounded bg-muted">Tab</kbd> to accept a suggestion
              </div>
              <DropdownMenuItem asChild>
                <a href="/admin" className="text-xs cursor-pointer">
                  Manage AI settings
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reply Sources Filter */}
          <Dialog open={showSourcesModal} onOpenChange={setShowSourcesModal}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Filter reply sources"
                onClick={() => {
                  addTelemetryEvent({
                    event: 'reply_sources_filter_opened',
                    ticketId,
                  });
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Reply Suggester Sources</DialogTitle>
                <DialogDescription>
                  Select which sources to use for reply suggestions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="solution_articles"
                    checked={selectedSources.solution_articles}
                    onCheckedChange={(checked) =>
                      setSelectedSources({ ...selectedSources, solution_articles: !!checked })
                    }
                  />
                  <Label htmlFor="solution_articles" className="cursor-pointer">
                    Solution Articles
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="similar_tickets"
                    checked={selectedSources.similar_tickets}
                    onCheckedChange={(checked) =>
                      setSelectedSources({ ...selectedSources, similar_tickets: !!checked })
                    }
                  />
                  <Label htmlFor="similar_tickets" className="cursor-pointer">
                    Similar Tickets
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="canned_responses"
                    checked={selectedSources.canned_responses}
                    onCheckedChange={(checked) =>
                      setSelectedSources({ ...selectedSources, canned_responses: !!checked })
                    }
                  />
                  <Label htmlFor="canned_responses" className="cursor-pointer">
                    Canned Responses
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="external_kb"
                    checked={selectedSources.external_kb}
                    onCheckedChange={(checked) =>
                      setSelectedSources({ ...selectedSources, external_kb: !!checked })
                    }
                  />
                  <Label htmlFor="external_kb" className="cursor-pointer">
                    External Knowledge Bases (optional)
                  </Label>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Switch
                    id="saveAsDefault"
                    checked={saveAsDefault}
                    onCheckedChange={setSaveAsDefault}
                  />
                  <Label htmlFor="saveAsDefault" className="cursor-pointer">
                    Save selection as default
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowSourcesModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyReplySources}>
                  Apply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          {showVerify && (
            <Button variant="outline" size="sm" onClick={handleVerify}>
              Verify
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </div>
      </div>

      {/* AI Suggestion Box (shown when no draft and has suggestion) */}
      {liveSuggestion && !draft && (
        <div 
          className="border border-border rounded-xl p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-all shadow-sm"
          onClick={handleAcceptSuggestion}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAcceptSuggestion();
            }
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              AI Suggested Reply
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowSourcesModal(true);
              }}
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-base leading-relaxed text-foreground mb-3">
            {liveSuggestion}
          </p>
          <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: '#C0C0C0' }}>
            Press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-xs font-mono text-foreground">Tab</kbd> to accept this suggestion
          </p>
        </div>
      )}

      {/* Editor (shown when typing or no suggestion) */}
      {(!liveSuggestion || draft) && (
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[144px] max-h-[432px] resize-none"
          aria-label="Reply editor"
        />
      )}

      {/* Bottom Formatting Toolbar */}
      <div
        className="flex items-center gap-0.5 border-t border-border pt-2 -mb-1"
        role="toolbar"
        aria-label="Formatting toolbar"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('bold')}
          aria-label="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('italic')}
          aria-label="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('underline')}
          aria-label="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('strikethrough')}
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('bullet')}
          aria-label="Bulleted list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('numbered')}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('quote')}
          aria-label="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('code')}
          aria-label="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowLinkDialog(true)}
          aria-label="Insert link (Ctrl+K)"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <FileAttachment>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </FileAttachment>
        <EmojiPicker onSelect={handleInsertEmoji}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </EmojiPicker>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            // Simple undo: clear draft
            if (draft) {
              setDraft('');
            }
          }}
          aria-label="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Redo (Ctrl+Y)"
          disabled
        >
          <Redo className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More formatting options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Font size</DropdownMenuItem>
            <DropdownMenuItem disabled>Alignment</DropdownMenuItem>
            <DropdownMenuItem disabled>Clear formatting</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Link Dialog */}
      <LinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onInsert={handleInsertLink}
      />
    </div>
  );
};
