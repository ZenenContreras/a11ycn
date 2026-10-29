import { readFileSync } from "node:fs";
import path from "node:path";
import { Command, CommanderError } from "commander";
import { ruleCatalog, RULE_IDS } from "eslint-plugin-a11ycn";
import { audit, normalizeRules, parseFailOn, renderReport, writeReport } from "./audit.js";
import { CONFIG_FILENAME, writeConfig } from "./config.js";
import { availableLocales, resolveLocale, t } from "./i18n.js";
import type { Format } from "./types.js";

interface AuditFlags {
  format?: string;
  out?: string;
  failOn: string;
  rules?: string;
  url?: string;
  cache?: boolean;
  lang?: string;
}

export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();
  program.name("a11ycn").description(t("en", "cli.description")).version(readVersion());

  let exitCode = 0;
  program
    .command("audit")
    .argument("[path]", t("en", "cli.auditPath"), ".")
    .option("--format <format>", t("en", "cli.format"))
    .option("--out <file>", t("en", "cli.out"))
    .option("--fail-on <severity>", t("en", "cli.failOn"), "serious")
    .option("--rules <ids>", t("en", "cli.rulesFlag"))
    .option("--url <url>", t("en", "cli.url"))
    .option("--lang <code>", t("en", "cli.lang"))
    .option("--no-cache", t("en", "cli.noCache"))
    .action(async (target: string, opts: AuditFlags) => {
      exitCode = await executeAudit(target, opts, argv);
    });

  program.command("rules").option("--lang <code>", t("en", "cli.lang")).action(async (opts: { lang?: string }) => {
    exitCode = await printRules(opts.lang);
  });

  program
    .command("badge")
    .argument("[path]", t("en", "cli.auditPath"), ".")
    .option("--lang <code>", t("en", "cli.lang"))
    .option("--no-cache", t("en", "cli.noCache"))
    .action(async (target: string, opts: { lang?: string; cache?: boolean }) => {
      exitCode = await printBadge(target, opts);
    });

  program
    .command("init")
    .option("--force", "Replace an existing a11ycn.config.json")
    .option("--lang <code>", t("en", "cli.lang"))
    .action(async (opts: { force?: boolean; lang?: string }) => {
      exitCode = await initConfig(opts);
    });

  program.exitOverride();
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode;
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return exitCode;
}

async function executeAudit(target: string, opts: AuditFlags, argv: string[]): Promise<number> {
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
    failOnExplicit: argv.includes("--fail-on"),
    rules,
    cache: opts.cache !== false,
    version: readVersion(),
    lang: opts.lang ?? null,
  });
  for (const warning of result.warnings) console.error(warning);
  if (opts.out) {
    const fileFormat = format ?? inferFormat(opts.out);
    await writeReport(result.report, fileFormat, opts.out, result.locale);
    console.log(renderReport(result.report, "console", result.locale));
    console.error(t(result.locale, "cli.wrote", { file: opts.out }));
  } else if (format) {
    process.stdout.write(renderReport(result.report, format, result.locale));
  } else {
    console.log(renderReport(result.report, "console", result.locale));
  }
  if (result.exitCode === 2) console.error(t(result.locale, "cli.failed", { severity: failOn }));
  return result.exitCode;
}

async function printRules(lang?: string): Promise<number> {
  const resolved = resolveLocale({ flag: lang });
  if (resolved.error) {
    console.error(t("en", "cli.unknownLang", { value: resolved.error, list: availableLocales().join(", ") }));
    return 1;
  }
  const locale = resolved.locale;
  console.log(t(locale, "cli.rulesIntro"));
  for (const id of RULE_IDS) {
    const rule = ruleCatalog[id];
    if (!rule) continue;
    const wcag = rule.wcag.map((item) => `${item.criterion} ${item.level}`).join(", ");
    const severity = Object.values(rule.messages)[0]?.severity ?? "serious";
    console.log(`${id}\t${wcag}\t${severity}\t${rule.summary}`);
  }
  return 0;
}

async function printBadge(target: string, opts: { lang?: string; cache?: boolean }): Promise<number> {
  const result = await audit({
    path: target,
    failOn: "minor",
    cache: opts.cache !== false,
    lang: opts.lang ?? null,
    version: readVersion(),
  });
  const score = result.report.summary.score;
  const color = score >= 90 ? "brightgreen" : score >= 70 ? "yellow" : "red";
  const url = `https://img.shields.io/badge/a11ycn_score-${score}-${color}`;
  console.log(`[![a11ycn score](${url})](https://github.com/ZenenContreras/a11ycn)`);
  return 0;
}

async function initConfig(opts: { force?: boolean; lang?: string }): Promise<number> {
  const locale = opts.lang === "es" ? "es" : "en";
  const result = await writeConfig(process.cwd(), Boolean(opts.force));
  if (!result.created) {
    console.error(t(locale, "cli.initExists", { file: CONFIG_FILENAME }));
    return 1;
  }
  console.log(t(locale, "cli.initWrote", { file: result.file }));
  return 0;
}

function parseFormat(value: string): Format {
  if (value === "md" || value === "json" || value === "sarif" || value === "github") return value;
  throw new Error(t("en", "cli.unknownFormat", { value }));
}

function inferFormat(file: string): Format {
  const extension = path.extname(file);
  if (extension === ".json") return "json";
  if (extension === ".md") return "md";
  if (extension === ".sarif") return "sarif";
  throw new Error(t("en", "cli.inferFormat", { file }));
}

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return "0.2.0";
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
