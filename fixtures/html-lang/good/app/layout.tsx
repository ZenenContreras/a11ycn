export const metadata = { title: "Harbor" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
