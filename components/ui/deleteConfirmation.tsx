import { Button } from '@/components/ui/stock components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/stock components/dialog';
import { Text } from '@/components/ui/stock components/text';
import type { ReactNode } from 'react';

// `trigger` replaces the default destructive button, e.g. with an icon button.
export function DeleteConfirmationDialog(
  {
    title,
    content,
    buttonTitle,
    trigger,
    onConfirm
  }:
  {
    title?: string;
    content?: string;
    buttonTitle?: string;
    trigger?: ReactNode;
    onConfirm?: () => void | Promise<void>;
  }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive">
            <Text>{buttonTitle}</Text>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {content}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>
              <Text>Tilbage</Text>
            </Button>
          </DialogClose>
          <Button variant={"destructive"} onPress={onConfirm}>
            <Text>Slet</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
