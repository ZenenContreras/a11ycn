export function Actions() {
  return (
    <div>
      <button type="button" className="size-5" aria-label="Close">
        x
      </button>
      <a href="/edit" className="h-4 w-4">
        Edit
      </a>
      <button type="button" aria-label="Add">
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
