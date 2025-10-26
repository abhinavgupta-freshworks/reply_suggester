import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDraftAutoSave = (
  ticketId: string | null,
  draft: string,
  onRestore: (draft: string) => void
) => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  // Load draft on mount or when ticket changes
  useEffect(() => {
    if (!ticketId) return;

    const key = `draft_${ticketId}`;
    const saved = localStorage.getItem(key);
    
    if (saved && saved !== draft) {
      onRestore(saved);
    }
  }, [ticketId]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!ticketId) return;

    intervalRef.current = setInterval(() => {
      if (draft && draft !== lastSavedRef.current) {
        const key = `draft_${ticketId}`;
        localStorage.setItem(key, draft);
        lastSavedRef.current = draft;
      }
    }, 10000); // 10 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticketId, draft]);

  // Clear draft
  const clearDraft = () => {
    if (!ticketId) return;
    const key = `draft_${ticketId}`;
    localStorage.removeItem(key);
    lastSavedRef.current = '';
  };

  return { clearDraft };
};
