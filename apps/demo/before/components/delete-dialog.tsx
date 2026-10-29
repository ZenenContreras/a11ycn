import { Button } from "./ui/button";

export function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete account</Button>
      </DialogTrigger>
      <DialogContent>
        <p>This permanently removes the workspace.</p>
      </DialogContent>
    </Dialog>
  );
}
