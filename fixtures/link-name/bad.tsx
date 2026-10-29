import Link from "next/link";
import { Settings } from "lucide-react";

export function Nav() {
  return (
    <nav>
      <Link href="/post">Read more</Link>
      <a href="/docs">click here</a>
      <Link href="/settings">
        <Settings />
      </Link>
      <a href="/empty"></a>
    </nav>
  );
}
