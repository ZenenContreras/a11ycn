export function isDisabled(source: string, line: number, ruleId: string): boolean {
  return createDisableMap(source)(line, ruleId);
}

export function createDisableMap(source: string): (line: number, ruleId: string) => boolean {
  const lines = source.split(/\r?\n/);
  const nextLine = new Map<number, Set<string> | null>();
  const ranges: { start: number; rules: Set<string> | null }[] = [];

  lines.forEach((text, index) => {
    const lineNo = index + 1;
    const next = text.match(
      /a11ycn-disable-next-line\b(?:[ \t]+([a-z0-9-]+(?:[ \t]*,[ \t]*[a-z0-9-]+)*))?/,
    );
    if (next) nextLine.set(lineNo + 1, next[1] ? splitRules(next[1]) : null);
    const stripped = text.replace(/a11ycn-disable-next-line\b/g, "");
    const block = stripped.match(/a11ycn-disable\b(?:[ \t]+([a-z0-9-]+(?:[ \t]*,[ \t]*[a-z0-9-]+)*))?/);
    if (block) ranges.push({ start: lineNo, rules: block[1] ? splitRules(block[1]) : null });
  });

  return (line, ruleId) => {
    const next = nextLine.get(line);
    if (next !== undefined && (next === null || next.has(ruleId))) return true;
    return ranges.some((range) => line >= range.start && (range.rules === null || range.rules.has(ruleId)));
  };
}

function splitRules(value: string): Set<string> {
  return new Set(
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}
