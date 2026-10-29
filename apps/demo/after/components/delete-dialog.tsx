import { Button } from "./ui/button";

export function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>This permanently removes the workspace and its messages.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
