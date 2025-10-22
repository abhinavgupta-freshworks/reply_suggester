import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { BookOpen, MessageSquare } from 'lucide-react';

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
  const { state } = useAppContext();

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

  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold mb-4">Context & KB</h2>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* KB Articles */}
          {kbArticles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Knowledge Base</h3>
              </div>
              <div className="space-y-2">
                {kbArticles.map(kb => (
                  <div key={kb.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-mono text-muted-foreground mb-1">{kb.id}</p>
                    <h4 className="text-sm font-medium mb-1">{kb.title}</h4>
                    <p className="text-xs text-muted-foreground">{kb.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canned Responses */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Canned Responses</h3>
            </div>
            <div className="space-y-2">
              {state.canned_responses.map(cr => (
                <div key={cr.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium mb-1">{cr.title}</h4>
                  <p className="text-xs text-muted-foreground">{cr.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment Legend */}
          {state.admin_config.features.sentiment && (
            <div>
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
