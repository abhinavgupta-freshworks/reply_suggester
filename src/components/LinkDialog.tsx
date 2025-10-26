import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string, url: string) => void;
}

export const LinkDialog = ({ open, onOpenChange, onInsert }: LinkDialogProps) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const handleInsert = () => {
    if (text && url) {
      onInsert(text, url);
      setText('');
      setUrl('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Add a hyperlink to your reply
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              id="link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Click here"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!text || !url}>
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
