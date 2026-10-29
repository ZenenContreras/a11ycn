import { readFileSync } from "node:fs";
import path from "node:path";
import { Command, CommanderError } from "commander";
import { audit, normalizeRules, parseFailOn, renderReport, writeReport } from "./audit.js";
import type { Format } from "./types.js";

export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();
  program
    .name("a11ycn")
    .description("Deterministic WCAG 2.2 audits for React, Next.js, Tailwind, and shadcn/ui.")
    .version(readVersion());

  let exitCode = 0;
  program
    .command("audit")
    .argument("[path]", "File or directory to scan", ".")
    .option("--format <format>", "Output format: md or json")
    .option("--out <file>", "Write the report to this file")
    .option("--fail-on <severity>", "Exit with code 2 at this severity or higher", "serious")
    .option("--rules <ids>", "Comma-separated rule ids to run")
    .option("--url <url>", "Record a page URL. Browser checks are not available in this version.")
    .option("--no-cache", "Disable the file-hash cache")
    .action(async (target: string, opts: AuditFlags) => {
      exitCode = await executeAudit(target, opts);
    });

  program.exitOverride();
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode;
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
  return exitCode;
}

interface AuditFlags {
  format?: string;
  out?: string;
  failOn: string;
  rules?: string;
  url?: string;
  cache?: boolean;
}

async function executeAudit(target: string, opts: AuditFlags): Promise<number> {
  const format = opts.format ? parseFormat(opts.format) : undefined;
  const rules = opts.rules
    ?.split(",")
    .map((ruleId) => ruleId.trim())
    .filter(Boolean);
  normalizeRules(rules);
  const failOn = parseFailOn(opts.failOn);
  const result = await audit({
    path: target,
    url: opts.url ?? null,
    failOn,
    rules,
    cache: opts.cache !== false,
    version: readVersion(),
  });
  for (const warning of result.warnings) console.error(warning);
  if (opts.out) {
    const fileFormat = format ?? inferFormat(opts.out);
    await writeReport(result.report, fileFormat, opts.out);
    console.log(renderReport(result.report, "console"));
    console.error(`Wrote ${opts.out}`);
  } else if (format) {
    process.stdout.write(renderReport(result.report, format));
  } else {
    console.log(renderReport(result.report, "console"));
  }
  if (result.exitCode === 2) console.error(`Failed: findings at or above ${failOn}.`);
  return result.exitCode;
}

function parseFormat(value: string): Format {
  if (value === "md" || value === "json") return value;
  throw new Error(`Unknown format "${value}". Use md or json.`);
}

function inferFormat(file: string): Format {
  const extension = path.extname(file);
  if (extension === ".json") return "json";
  if (extension === ".md") return "md";
  throw new Error(`Cannot infer a format from "${file}". Pass --format md or --format json.`);
}

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return "0.1.0";
  }
}

const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
  : false;

if (invokedDirectly) {
  runCli(process.argv).then((code) => {
    process.exit(code);
  });
}
