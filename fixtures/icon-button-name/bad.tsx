import { Menu, X } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";

export function Toolbar() {
  return (
    <div>
      <button type="button">
        <Menu />
      </button>
      <Button type="button">
        <X />
      </Button>
      <button type="button">
        <Cross2Icon />
      </button>
    </div>
  );
}
