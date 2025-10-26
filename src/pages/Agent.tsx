import { useAppContext } from '@/contexts/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TicketList } from '@/components/TicketList';
import { ConversationPanel } from '@/components/ConversationPanel';
import { ContextPanel } from '@/components/ContextPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Agent = () => {
  const { state, setContextPanelVisible } = useAppContext();

  return (
    <div className="flex min-h-screen bg-background overflow-y-auto">
      <Sidebar />
      <div className={cn(
        "flex-1 min-h-0 h-screen grid gap-4 p-4 overflow-hidden",
        state.contextPanelVisible ? "grid-cols-[280px_1fr_360px]" : "grid-cols-[280px_1fr]"
      )}>
        <TicketList />
        <div className="relative">
          <ConversationPanel />
          {/* Toggle button for Context Panel */}
          {!state.contextPanelVisible && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              onClick={() => setContextPanelVisible(true)}
              title="Show Context Panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {state.contextPanelVisible && (
          <div className="relative">
            <ContextPanel />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-6 w-6 opacity-60 hover:opacity-100"
              onClick={() => setContextPanelVisible(false)}
              title="Hide Context Panel"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;
