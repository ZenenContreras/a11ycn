const SPACING: Record<string, number> = {
  "0": 0,
  px: 1,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
  "20": 80,
  "24": 96,
  "28": 112,
  "32": 128,
  "36": 144,
  "40": 160,
  "44": 176,
  "48": 192,
  "52": 208,
  "56": 224,
  "60": 240,
  "64": 256,
  "72": 288,
  "80": 320,
  "96": 384,
};

export interface BoxModel {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  padX: number;
  padY: number;
  unresolvedSize: boolean;
  unresolvedPad: boolean;
}

export function spacingPx(token: string): number | null {
  if (Object.prototype.hasOwnProperty.call(SPACING, token)) return SPACING[token] ?? null;
  const arbitrary = token.match(/^\[(.+)]$/);
  if (!arbitrary?.[1]) return null;
  return arbitraryToPx(arbitrary[1]);
}

export function boxFromTokens(tokens: string[]): BoxModel {
  const box: BoxModel = { padX: 0, padY: 0, unresolvedSize: false, unresolvedPad: false };
  let padL = 0;
  let padR = 0;
  let padT = 0;
  let padB = 0;
  for (const token of tokens) {
    if (hasVariantPrefix(token)) continue;
    const sized = token.match(/^(size|w|h|min-w|min-h|p|px|py|pt|pr|pb|pl)-(.+)$/);
    if (!sized?.[1] || !sized[2]) continue;
    const px = spacingPx(sized[2]);
    if (px === null) {
      if (sized[1] === "p" || sized[1].startsWith("p")) box.unresolvedPad = true;
      else box.unresolvedSize = true;
      continue;
    }
    if (sized[1] === "size") {
      box.width = px;
      box.height = px;
    } else if (sized[1] === "w") box.width = px;
    else if (sized[1] === "h") box.height = px;
    else if (sized[1] === "min-w") box.minWidth = px;
    else if (sized[1] === "min-h") box.minHeight = px;
    else if (sized[1] === "p") {
      padL = px;
      padR = px;
      padT = px;
      padB = px;
    } else if (sized[1] === "px") {
      padL = px;
      padR = px;
    } else if (sized[1] === "py") {
      padT = px;
      padB = px;
    } else if (sized[1] === "pt") padT = px;
    else if (sized[1] === "pr") padR = px;
    else if (sized[1] === "pb") padB = px;
    else if (sized[1] === "pl") padL = px;
  }
  box.padX = padL + padR;
  box.padY = padT + padB;
  return box;
}

export function compensatedSize(box: BoxModel): { width?: number; height?: number } {
  return {
    width: applyMin(add(box.width, box.padX), box.minWidth),
    height: applyMin(add(box.height, box.padY), box.minHeight),
  };
}

function add(value: number | undefined, padding: number): number | undefined {
  if (value === undefined) return undefined;
  return value + padding;
}

function applyMin(value: number | undefined, min: number | undefined): number | undefined {
  if (value === undefined) return min;
  if (min === undefined) return value;
  return Math.max(value, min);
}

function hasVariantPrefix(token: string): boolean {
  const colon = token.indexOf(":");
  if (colon === -1) return false;
  const arbitrary = token.indexOf("[");
  return arbitrary === -1 || colon < arbitrary;
}

function arbitraryToPx(value: string): number | null {
  const px = value.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (px?.[1]) return Number(px[1]);
  const rem = value.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (rem?.[1]) return Number(rem[1]) * 16;
  return null;
}
