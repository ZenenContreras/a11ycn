import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: {
    default: "Harbor",
    template: "%s · Harbor",
  },
  description: "A team inbox.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="scroll-pt-16">
        <a href="#content" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
