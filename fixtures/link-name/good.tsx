import Link from "next/link";
import { Settings } from "lucide-react";

export function Nav() {
  return (
    <nav>
      <Link href="/post">Read the pricing announcement</Link>
      <a href="/docs">Installation guide</a>
      <Link href="/settings" aria-label="Settings">
        <Settings />
      </Link>
      <a href="/help">
        <span className="sr-only">Help center</span>
      </a>
    </nav>
  );
}
