export const metadata = { title: "Contrast" };

export default function Page() {
  return (
    <main>
      <h1>Contrast</h1>
      <p className="bg-background text-muted-foreground">Muted and too light</p>
      <p className="bg-background text-foreground">Dark enough</p>
    </main>
  );
}
