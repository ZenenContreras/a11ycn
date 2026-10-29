export function Field() {
  return (
    <div>
      <FormItem>
        <FormLabel>Email</FormLabel>
        <Input id="email" aria-invalid="true" aria-describedby="email-error" />
        <FormMessage />
      </FormItem>
      <input id="name" aria-invalid="true" aria-describedby="name-error" />
      <p id="name-error" className="text-red-600">
        Enter a name.
      </p>
    </div>
  );
}
