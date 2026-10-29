export function Signup() {
  return (
    <form>
      <Input placeholder="Email" />
      <Textarea placeholder="About" />
      <Checkbox />
      <input placeholder="Name" />
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
      </Select>
    </form>
  );
}
