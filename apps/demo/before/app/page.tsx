import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "../components/header";

export const metadata = { title: "Harbor" };

export default function HomePage() {
  return (
    <div>
      <Header />
      <img src="/hero.png" />
      <img src="/banner.png" alt="banner.png" />
      <Image src="/photo.jpg" alt="image" width={960} height={540} />
      <p className="bg-white text-gray-400">A quieter inbox for small teams.</p>
      <button className="outline-none">Get started</button>
      <div onClick={() => {}}>View product tour</div>
      <Link href="/blog/welcome">Read more</Link>
      <Link href="/settings">
        <ArrowRight />
      </Link>
    </div>
  );
}
