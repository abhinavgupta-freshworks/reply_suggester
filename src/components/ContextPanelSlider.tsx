import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

interface ContextPanelSliderProps {
  visible: boolean;
  onToggle: () => void;
}

export const ContextPanelSlider = ({ visible, onToggle }: ContextPanelSliderProps) => {
  const { state } = useAppContext();

  if (!visible) return null;

  if (!state.activeTicket) {
    return (
      <div className="relative w-[360px] h-full">
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-20 rounded-l-lg rounded-r-none bg-muted hover:bg-primary/20 cursor-pointer z-10 px-1"
          onClick={onToggle}
          title="Hide Context Panel"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Card className="h-full p-4 ml-6">
          <p className="text-sm text-muted-foreground">No ticket selected</p>
        </Card>
      </div>
    );
  }

  const kbArticles = state.kb_articles.filter(kb =>
    state.activeTicket?.kb_refs.includes(kb.id)
  );

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

  return (
    <div className="relative w-[360px] h-full">
      {/* Slim collapse handle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-24 rounded-l-lg rounded-r-none bg-muted/90 hover:bg-primary/30 border border-r-0 border-border cursor-pointer z-50 px-1.5 shadow-sm"
        onClick={onToggle}
        title="Hide Context Panel"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Panel content */}
      <Card className="h-full overflow-hidden flex flex-col ml-6">
        <div className="p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold">Context & KB</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <Accordion type="multiple" defaultValue={["articles", "tickets", "responses", "sentiment"]} className="space-y-2">
              {/* Solution Articles */}
              <AccordionItem value="articles" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Solution Articles</span>
                    <Badge variant="secondary" className="ml-1">{kbArticles.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  {kbArticles.map(kb => (
                    <div key={kb.id} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs font-mono text-muted-foreground mb-1">{kb.id}</p>
                      <h4 className="text-sm font-medium mb-1">{kb.title}</h4>
                      <p className="text-xs text-muted-foreground">{kb.content}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Similar Tickets */}
              <AccordionItem value="tickets" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Similar Tickets</span>
                    <Badge variant="secondary" className="ml-1">{similarTickets.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
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
                </AccordionContent>
              </AccordionItem>

              {/* Canned Responses */}
              <AccordionItem value="responses" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Canned Responses</span>
                    <Badge variant="secondary" className="ml-1">{state.canned_responses.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  {state.canned_responses.map(cr => (
                    <div key={cr.id} className="rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors cursor-pointer">
                      <h4 className="text-sm font-medium mb-1">{cr.title}</h4>
                      <p className="text-xs text-muted-foreground">{cr.text}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Sentiment Legend */}
              {state.admin_config.features.sentiment && (
                <AccordionItem value="sentiment" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="text-sm font-medium">Sentiment Legend</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1.5">
                      {Object.entries(sentimentEmoji).map(([key, emoji]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-lg">{emoji}</span>
                          <span className={`text-sm capitalize ${sentimentColors[key]}`}>{key}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
