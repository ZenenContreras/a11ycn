export function Actions() {
  return (
    <div>
      <button type="button" className="size-6" aria-label="Close">
        x
      </button>
      <a href="/edit" className="h-4 w-4 p-1">
        Edit
      </a>
      <button type="button" className="p-2" aria-label="Add">
        <Icon className="h-4 w-4" />
      </button>
      <button type="button" className="px-4 py-2">
        Save changes
      </button>
    </div>
  );
}
