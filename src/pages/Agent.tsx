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
              className="fixed top-1/2 right-2 -translate-y-1/2 h-8 w-8 z-50 shadow"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;
