import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onOpenChange, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-1000 animate-in fade-in duration-300" />
        <Dialog.Content 
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-white border border-black/5 rounded-3xl p-8 z-1001 outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-xl font-black tracking-tight text-text-title">
                {title}
              </Dialog.Title>
              <Dialog.Close className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/5 transition-all btn-premium">
                <X size={18} strokeWidth={2.5} />
              </Dialog.Close>
            </div>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
