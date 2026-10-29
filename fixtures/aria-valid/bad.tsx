export function Widget() {
  return (
    <div>
      <div role="not-a-role">Nope</div>
      <button aria-hidden="true">Hidden</button>
      <div aria-labell="Close">Close</div>
    </div>
  );
}
