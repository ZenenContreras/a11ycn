export function Code() {
  return <input type="password" onPaste={(event) => event.preventDefault()} />;
}
