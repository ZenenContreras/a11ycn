export const metadata = { title: "App" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
