declare module "culori" {
  export interface Color {
    alpha?: number;
    mode?: string;
  }
  export function parse(value: string): Color | undefined;
  export function formatHex(color: Color): string | undefined;
  export function wcagContrast(foreground: string, background: string): number;
}
