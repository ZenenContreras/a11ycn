export function DeleteAccount() {
  return (
    <div>
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogTitle>
            <VisuallyHidden>Confirm</VisuallyHidden>
          </AlertDialogTitle>
          <AlertDialogDescription>Continue?</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
