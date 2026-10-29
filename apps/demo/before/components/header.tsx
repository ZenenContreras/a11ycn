import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="sticky top-0 flex items-center justify-between bg-white px-4">
      <Link href="/" className="focus:outline-none">
        Harbor
      </Link>
      <Button size="icon" className="size-5">
        <Menu />
      </Button>
    </header>
  );
}
