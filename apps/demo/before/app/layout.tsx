import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Harbor" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
