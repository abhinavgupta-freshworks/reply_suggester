import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FileAttachmentProps {
  onAttach?: (files: File[]) => void;
  children: React.ReactNode;
}

export const FileAttachment = ({ onAttach, children }: FileAttachmentProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      if (onAttach) {
        onAttach(files);
      } else {
        // MVP: Show placeholder message
        toast({
          title: 'File attachment',
          description: 'File attachment feature coming soon',
          duration: 3000,
        });
      }
    }
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <div onClick={handleClick}>
        {children}
      </div>
    </>
  );
};
