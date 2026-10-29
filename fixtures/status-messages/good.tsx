import { Toaster } from "sonner";

export function Notice() {
  return (
    <div>
      <Toaster />
      <div className="toast">Saved</div>
    </div>
  );
}
