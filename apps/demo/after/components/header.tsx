import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="sticky top-0 flex items-center justify-between bg-white px-4 py-3">
      <Link href="/" className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2">
        Harbor home
      </Link>
      <Button type="button" size="icon" className="size-10" aria-label="Open menu">
        <Menu />
        <span className="sr-only">Open menu</span>
      </Button>
    </header>
  );
}
