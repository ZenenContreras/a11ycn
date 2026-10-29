import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export const metadata = { title: "Harbor" };

export default function RegisterPage() {
  return (
    <form>
      <h1>Create your account</h1>
      <Input placeholder="Email" />
      <Input placeholder="Password" type="password" />
      <Textarea placeholder="About you" />
      <Checkbox />
      <button type="submit">Create account</button>
    </form>
  );
}
