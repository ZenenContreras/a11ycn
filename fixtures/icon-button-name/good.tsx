import { Menu, X } from "lucide-react";

export function Toolbar() {
  return (
    <div>
      <button type="button" aria-label="Open menu">
        <Menu />
      </button>
      <button type="button">
        <X />
        <span className="sr-only">Close</span>
      </button>
      <button type="button">
        <Menu /> Save
      </button>
    </div>
  );
}
