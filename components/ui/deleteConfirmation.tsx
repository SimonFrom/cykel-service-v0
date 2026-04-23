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


export function DeleteConfirmationDialog(
  {
    title,
    content,
    buttonTitle,
    onConfirm
  }:
  {
    title?: string;
    content?: string;
    buttonTitle?: string;
    onConfirm?: () => void | Promise<void>;
  }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Text>{buttonTitle}</Text>
        </Button>
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
