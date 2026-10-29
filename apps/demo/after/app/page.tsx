import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "../components/header";

export const metadata = { title: "Overview" };

export default function HomePage() {
  return (
    <main id="content">
      <Header />
      <h1>Harbor</h1>
      <img src="/hero.png" alt="Two teammates reviewing a shared inbox on a laptop" />
      <img src="/banner.png" alt="" />
      <Image src="/photo.jpg" alt="Harbor inbox with three unread conversations" width={960} height={540} />
      <p className="bg-white text-neutral-800">A quieter inbox for small teams.</p>
      <button className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Get started
      </button>
      <button type="button">View product tour</button>
      <Link href="/blog/welcome">Read the welcome post</Link>
      <Link href="/settings" aria-label="Account settings">
        <ArrowRight />
        <span className="sr-only">Account settings</span>
      </Link>
    </main>
  );
}
