export function Signup() {
  return (
    <form>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" />
      <label htmlFor="about">About</label>
      <Textarea id="about" />
      <Label htmlFor="terms">Accept terms</Label>
      <Checkbox id="terms" />
      <label>
        Name
        <input name="name" autoComplete="name" />
      </label>
      <FormItem>
        <FormLabel>Role</FormLabel>
        <FormControl>
          <Select>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </Select>
        </FormControl>
      </FormItem>
      <input type="hidden" name="token" value="1" />
      <input aria-label="Search" />
    </form>
  );
}
