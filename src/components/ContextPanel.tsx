import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen, MessageSquare, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';

const sentimentColors: Record<string, string> = {
  happy: 'text-sentiment-happy',
  neutral: 'text-sentiment-neutral',
  sad: 'text-sentiment-sad',
  angry: 'text-sentiment-angry',
};

const sentimentEmoji: Record<string, string> = {
  happy: '😀',
  neutral: '😐',
  sad: '😞',
  angry: '😡',
};

export const ContextPanel = () => {
  const { state, setContextPanelVisible } = useAppContext();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!state.activeTicket) {
    return (
      <Card className="h-full p-4">
        <p className="text-sm text-muted-foreground">No ticket selected</p>
      </Card>
    );
  }

  const kbArticles = state.kb_articles.filter(kb =>
    state.activeTicket?.kb_refs.includes(kb.id)
  );

  // Mock similar tickets for demonstration
  const similarTickets = [
    {
      id: 'T-2023-001',
      subject: 'Similar login issue',
      resolution: 'Password reset resolved the issue',
      similarity: 95
    },
    {
      id: 'T-2023-045',
      subject: 'Account access problem',
      resolution: 'Cleared browser cache and cookies',
      similarity: 87
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    count: number
  ) => {
    const isExpanded = expandedSection === id;

    return (
      <div className="border border-border rounded-lg">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary" className="ml-1">{count}</Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {isExpanded && (
          <div className="border-t border-border bg-muted/30">
            <div className="p-3 space-y-3">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSection(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {content}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Context & KB</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setContextPanelVisible(false)}
          title="Hide Context Panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {/* Solution Articles */}
          {renderSection(
            'solution_articles',
            'Solution Articles',
            <BookOpen className="h-4 w-4 text-primary" />,
            <div className="space-y-2">
              {kbArticles.map(kb => (
                <div key={kb.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs font-mono text-muted-foreground mb-1">{kb.id}</p>
                  <h4 className="text-sm font-medium mb-1">{kb.title}</h4>
                  <p className="text-xs text-muted-foreground">{kb.content}</p>
                </div>
              ))}
            </div>,
            kbArticles.length
          )}

          {/* Similar Tickets */}
          {renderSection(
            'similar_tickets',
            'Similar Tickets',
            <FileText className="h-4 w-4 text-primary" />,
            <div className="space-y-2">
              {similarTickets.map(ticket => (
                <div key={ticket.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-mono text-muted-foreground">{ticket.id}</p>
                    <Badge variant="outline" className="text-xs">{ticket.similarity}% match</Badge>
                  </div>
                  <h4 className="text-sm font-medium mb-1">{ticket.subject}</h4>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Resolution:</span> {ticket.resolution}
                  </p>
                </div>
              ))}
            </div>,
            similarTickets.length
          )}

          {/* Canned Responses */}
          {renderSection(
            'canned_responses',
            'Canned Responses',
            <MessageSquare className="h-4 w-4 text-primary" />,
            <div className="space-y-2">
              {state.canned_responses.map(cr => (
                <div key={cr.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium mb-1">{cr.title}</h4>
                  <p className="text-xs text-muted-foreground">{cr.text}</p>
                </div>
              ))}
            </div>,
            state.canned_responses.length
          )}

          {/* Sentiment Legend */}
          {state.admin_config.features.sentiment && (
            <div className="border border-border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Sentiment Legend</h3>
              <div className="space-y-1.5">
                {Object.entries(sentimentEmoji).map(([key, emoji]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <span className={`text-sm capitalize ${sentimentColors[key]}`}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
