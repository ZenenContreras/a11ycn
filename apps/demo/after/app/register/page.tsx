import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <main id="content">
      <h1>Create your account</h1>
      <form>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" />
        <Label htmlFor="about">About you</Label>
        <Textarea id="about" />
        <Checkbox id="terms" />
        <Label htmlFor="terms">I agree to the terms</Label>
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
